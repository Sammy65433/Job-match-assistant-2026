const MAX_RESUME_LENGTH = 20000;
const MAX_JOB_LENGTH = 15000;
const MAX_KEYWORDS = 100;

function clean(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsPhrase(text, phrase) {
  const pattern = new RegExp(
    `(?<![a-z0-9])${escapeRegex(phrase)}(?![a-z0-9])`,
    "i"
  );
  return pattern.test(text);
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

  const resume = clean(resumeText);
  const listing = clean(`${jobTitle} ${jobDescription}`);
  const unique = [...new Set(keywords.map(clean))];

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
