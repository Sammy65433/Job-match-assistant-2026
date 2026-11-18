import { Router } from "express";
import rateLimit from "express-rate-limit";

import { generateFitExplanation } from "../fitExplainer.js";
import { requireJobUser } from "../middleware/requireJobUser.js";
import { validTrack } from "../validation.js";

const router = Router();

const MAX_TITLE_LENGTH = 150;
const MAX_COMPANY_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 15000;
const MAX_RESUME_LENGTH = 20000;
const MAX_SKILLS = 100;
const MAX_SKILL_LENGTH = 100;

const explainLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many explanations. Wait a few minutes and try again."
  }
});

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

function validScore(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 10
  );
} // end validScore

router.use(requireJobUser);

router.post("/", explainLimiter, async (req, res) => {
  const {
    track,
    title,
    company,
    description,
    resumeText,
    skills,
    matchScore,
    matchedSkills,
    missingSkills
  } = req.body ?? {};

  const cleanedTitle = clean(title, MAX_TITLE_LENGTH);
  const cleanedCompany = clean(company, MAX_COMPANY_LENGTH);
  const cleanedDescription = clean(description, MAX_DESCRIPTION_LENGTH);
  const cleanedResume = clean(resumeText, MAX_RESUME_LENGTH);
  const cleanedSkills = cleanList(skills);

  if (
    !validTrack(track) ||
    !cleanedTitle ||
    !cleanedCompany ||
    !cleanedDescription ||
    (!cleanedResume && cleanedSkills.length === 0)
  ) {
    return res.status(400).json({
      error:
        "Add the job title, company, description, and your resume text or skills."
    });
  } // end if invalid

  try {
    const { explanation, model } = await generateFitExplanation({
      track,
      title: cleanedTitle,
      company: cleanedCompany,
      description: cleanedDescription,
      resumeText: cleanedResume,
      skills: cleanedSkills,
      matchScore: validScore(matchScore) ? matchScore : null,
      matchedSkills: cleanList(matchedSkills),
      missingSkills: cleanList(missingSkills)
    });

    return res.json({ explanation, model });
  } catch (error) {
    console.error("Fit explanation failed:", error.message);
    return res.status(error.status || 500).json({
      error:
        error.name === "GeminiError" || (error.status && error.status < 500)
          ? error.message
          : "Could not explain this fit."
    });
  } // end try/catch
});

export default router;
