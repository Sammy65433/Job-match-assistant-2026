import { generateGeminiText } from "./gemini.js";

export const COVER_LETTER_TONES = {
  professional: "clear, professional, and specific",
  warm: "warm and personable, still professional",
  concise: "concise and direct, with short sentences",
  enthusiastic: "positive and enthusiastic without sounding exaggerated",
  direct: "direct and confident, focused on evidence"
};

const SYSTEM_PROMPT = `You write cover letters for early-career software and AI job applicants.

Hard rules:
1. Use only facts from APPLICANT PROFILE and JOB / COMPANY INFO. Never invent employers, job titles, dates, degrees, certifications, metrics, technologies, or personal stories.
2. If a detail is missing, leave it out. Never write bracketed placeholders like [Company] or [X years].
3. Never claim a degree, years of experience, or a skill that is not in the profile.
4. Write 5 paragraphs and about 280 to 340 words.
5. Start with "Dear Hiring Team," and end with "Sincerely," followed by the applicant's name.
6. Open with the specific role and company. Do not start with "I am writing", "I am excited", or "I am applying".
7. Connect one or two real projects from the profile to the job's actual needs. Prefer concrete details over adjectives.
8. Mention the company's product or mission only when the pasted job info supports it. Do not invent mission statements.
9. Match the requested tone.
10. Do not add qualifiers such as real-time, large-scale, enterprise, or production-grade unless the profile uses them.
11. Output only the letter. No markdown, headings, bullets, notes, or commentary.`;

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
} // end clean

function cleanupLetter(text, name) {
  let letter = String(text || "")
    .replace(/```[a-z]*\s*/gi, "")
    .replace(/```/g, "")
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\[(?:your name|name)\]/gi, name)
    .trim();

  if (!letter) return "";

  if (!/sincerely/i.test(letter) && name) {
    letter = `${letter}\n\nSincerely,\n${name}`;
  } // end if missing signature

  return letter.slice(0, 12000);
} // end cleanupLetter

export function buildCoverLetterPrompt({
  company,
  role,
  jobDescription,
  resumeText,
  tone,
  profile
}) {
  const safeProfile = profile && typeof profile === "object" ? profile : {};
  const name = clean(safeProfile.fullName, 120) || "the applicant";

  return `APPLICANT PROFILE
Name: ${name}
Email: ${clean(safeProfile.email, 200) || "Not provided"}
Phone: ${clean(safeProfile.phone, 60) || "Not provided"}
Location: ${clean(safeProfile.location, 160) || "Not provided"}
Links: ${clean(safeProfile.links, 400) || "Not provided"}

Background / resume:
${clean(resumeText, 20000) || "Not provided"}

JOB / COMPANY INFO
Company: ${clean(company, 150)}
Role: ${clean(role, 150)}
Tone: ${COVER_LETTER_TONES[tone] || COVER_LETTER_TONES.professional}

Pasted info:
${clean(jobDescription, 15000) || "Not provided"}

Write the cover letter now.`;
} // end buildCoverLetterPrompt

export async function generateCoverLetter(input) {
  const name = clean(input?.profile?.fullName, 120) || "the applicant";
  const prompt = buildCoverLetterPrompt(input);

  const { text, model } = await generateGeminiText({
    system: SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: 1600,
    temperature: 0.55,
    timeoutMs: 30000
  });

  const letter = cleanupLetter(text, name);

  if (!letter) {
    const error = new Error("The cover letter service returned an empty letter.");
    error.status = 502;
    throw error;
  } // end if empty

  return { letter, model };
} // end generateCoverLetter
