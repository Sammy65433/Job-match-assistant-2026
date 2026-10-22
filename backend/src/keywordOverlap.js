const MAX_RESUME_LENGTH = 20000;
const MAX_JOB_LENGTH = 15000;
const MAX_KEYWORDS = 100;

const TRACK_KEYWORDS = {
  software: [
    "javascript", "typescript", "react", "node.js", "express",
    "mongodb", "mongoose", "sql", "postgresql", "python",
    "java", "html", "css", "git", "rest apis", "graphql",
    "docker", "aws", "next.js", "vue", "angular", "c#",
    ".net", "php", "tailwind", "redux"
  ],
  data: [
    "sql", "python", "excel", "tableau", "power bi", "etl",
    "data analysis", "data visualization", "data modeling",
    "looker", "snowflake", "dbt", "statistics", "sqlite",
    "pandas", "bigquery"
  ],
  audio: [
    "pro tools", "logic pro", "ableton live", "audio editing",
    "audio recording", "vocal tracking", "vocal production",
    "mixing", "mastering", "sound design", "live sound",
    "signal flow", "microphone placement", "studio sessions",
    "podcast production"
  ]
};
export function compareFullJobDescription(body) {
  const { resumeText, jobDescription, track } = body ?? {};

  if (
    typeof resumeText !== "string" ||
    !resumeText.trim() ||
    resumeText.length > MAX_RESUME_LENGTH ||
    typeof jobDescription !== "string" ||
    !jobDescription.trim() ||
    jobDescription.length > MAX_JOB_LENGTH ||
    !Object.hasOwn(TRACK_KEYWORDS, track)
  ) {
    return { error: "Provide resume text, a job description, and a valid track." };
  }

  const resume = clean(resumeText);
  const listing = clean(jobDescription);
  const detected = TRACK_KEYWORDS[track].filter((word) =>
    containsPhrase(listing, word)
  );
  const matched = detected.filter((word) => containsPhrase(resume, word));
  const notFound = detected.filter((word) => !containsPhrase(resume, word));

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
