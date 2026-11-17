import { generateGeminiText } from "./gemini.js";

const MAX_LISTING = 15000;
const MAX_RESUME = 20000;
const MAX_SKILLS = 100;
const MAX_SKILL_LENGTH = 100;

const SYSTEM_PROMPT = `You explain job-fit results to early-career software, data, and AI job seekers.

Rules:
1. Use only the applicant material, the listing text, and the fit data provided. Do not invent skills, employers, degrees, certifications, or experience.
2. Never claim the applicant has a skill unless it appears in the applicant skills list or resume text.
3. Never guarantee an interview, offer, or hiring outcome.
4. Explain the fit score in plain language: what raised it and what lowered it. The score is a keyword-overlap estimate, not a qualification verdict.
5. If the listing text is short or has no clear requirements, say the score is unreliable.
6. For each gap, suggest an honest next step: a small project, coursework, or an adjacent skill the applicant already has. Never suggest exaggerating or hiding a gap.
7. Output plain text only. No markdown bold, headings, code blocks, or tables.
8. Use exactly this shape:
Why this score: <2 to 4 sentences>
Strengths:
- <item>
- <item>
Gaps:
- <item>
- <item>
Next step: <1 to 2 sentences>
9. Keep the whole answer under 260 words. If there are no clear gaps, say so under Gaps.`;

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
} // end clean

function cleanList(value) {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .map((item) => clean(item, MAX_SKILL_LENGTH))
        .filter(Boolean)
        .slice(0, MAX_SKILLS)
    )
  ];
} // end cleanList

function formatScore(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(1)} / 10`
    : "Not calculated";
} // end formatScore

export function buildFitPrompt({
  track,
  title,
  company,
  description,
  resumeText,
  skills,
  matchScore,
  matchedSkills,
  missingSkills
}) {
  const applicantSkills = cleanList(skills);
  const matched = cleanList(matchedSkills);
  const missing = cleanList(missingSkills);

  return `TRACK: ${clean(track, 40) || "Not provided"}
ROLE: ${clean(title, 200)}
COMPANY: ${clean(company, 150) || "Not provided"}

FIT SCORE: ${formatScore(matchScore)}
The score is the share of skills detected in the listing text that also appear in the applicant skills list. It is not a verified qualification score.

MATCHED SKILLS (in the listing and the applicant profile):
${matched.join(", ") || "None provided"}

MISSING SKILLS (mentioned in the listing, not in the applicant profile):
${missing.join(", ") || "None provided"}

APPLICANT SKILLS:
${applicantSkills.join(", ") || "Not provided"}

APPLICANT RESUME / BACKGROUND:
${clean(resumeText, MAX_RESUME) || "Not provided"}

LISTING TEXT:
${clean(description, MAX_LISTING) || "Not provided"}

Explain this fit now.`;
} // end buildFitPrompt

export async function generateFitExplanation(input) {
  const prompt = buildFitPrompt(input);

  const { text, model } = await generateGeminiText({
    system: SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: 900,
    temperature: 0.4,
    timeoutMs: 30000
  });

  return {
    explanation: text
      .replace(/\*\*/g, "")
      .replace(/^#{1,6}\s*/gm, "")
      .trim()
      .slice(0, 6000),
    model
  };
} // end generateFitExplanation
