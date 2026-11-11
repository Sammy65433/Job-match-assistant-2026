import { buildSkillGroups, cleanSkill, containsPhrase } from "./skills.js";

const MAX_RESUME_LENGTH = 20000;
const MAX_JOB_LENGTH = 15000;
const MAX_KEYWORDS = 100;
const SCORED_TRACKS = new Set(["software", "data", "audio", "ai"]);

export function compareFullJobDescription(body) {
  const { resumeText, jobDescription, track } = body ?? {};

  if (
    typeof resumeText !== "string" ||
    !resumeText.trim() ||
    resumeText.length > MAX_RESUME_LENGTH ||
    typeof jobDescription !== "string" ||
    !jobDescription.trim() ||
    jobDescription.length > MAX_JOB_LENGTH ||
    !SCORED_TRACKS.has(track)
  ) {
    return { error: "Provide resume text, a job description, and a valid track." };
  }

  const resume = cleanSkill(resumeText);
  const listing = cleanSkill(jobDescription);
  const { groups } = buildSkillGroups(track);

  const resumeDetected = new Set(
    groups
      .filter((group) =>
        group.patterns.some((pattern) => containsPhrase(resume, pattern))
      )
      .map((group) => group.key)
  );

  const detected = groups.filter((group) =>
    group.patterns.some((pattern) => containsPhrase(listing, pattern))
  );
  const matched = detected
    .filter((group) => resumeDetected.has(group.key))
    .map((group) => group.key);
  const notFound = detected
    .filter((group) => !resumeDetected.has(group.key))
    .map((group) => group.key);

  return {
    percentage: detected.length
      ? Math.round((matched.length / detected.length) * 100)
      : null,
    matched,
    notFound,
    detectedCount: detected.length,
    note:
      "Keyword overlap only. This does not verify experience, eligibility, or whether you should apply."
  };
}

export function keywordOverlap(body) {
  const { resumeText, jobTitle, jobDescription, keywords } = body ?? {};

  if (
    typeof resumeText !== "string" ||
    !resumeText.trim() ||
    resumeText.length > MAX_RESUME_LENGTH ||
    typeof jobTitle !== "string" ||
    !jobTitle.trim() ||
    jobTitle.length > 200 ||
    typeof jobDescription !== "string" ||
    jobDescription.length > MAX_JOB_LENGTH ||
    !Array.isArray(keywords) ||
    keywords.length < 1 ||
    keywords.length > MAX_KEYWORDS ||
    !keywords.every(
      (word) =>
        typeof word === "string" &&
        word.trim() &&
        word.length <= 100
    )
  ) {
    return {
      error: "Provide resume text, a job title, and 1 to 100 profile keywords."
    };
  }

  const resume = cleanSkill(resumeText);
  const listing = cleanSkill(`${jobTitle} ${jobDescription}`);
  const unique = [...new Set(keywords.map(cleanSkill).filter(Boolean))];

  const mentioned = unique.filter((word) => containsPhrase(listing, word));
  const overlap = mentioned.filter((word) => containsPhrase(resume, word));
  const notInResume = mentioned.filter(
    (word) => !containsPhrase(resume, word)
  );

  return {
    mentioned,
    overlap,
    notInResume,
    summary:
      mentioned.length === 0
        ? "No profile keywords were detected in the available listing text."
        : `${overlap.length} of ${mentioned.length} detected listing keywords also appear in your resume text.`,
    note:
      "Keyword overlap only. Listing text may be incomplete, and detected words are not verified required qualifications."
  };
}
