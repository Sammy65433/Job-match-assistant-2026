const MIN_DETECTED = 3;

// Skills we look for in listing text. Add terms here to tune detection.
const VOCAB = {
  software: [
    "javascript", "typescript", "react", "node.js", "express", "mongodb",
    "sql", "postgresql", "python", "java", "html", "css", "git",
    "rest apis", "graphql", "docker", "aws", "next.js", "vue", "angular",
    "c#", ".net", "php", "tailwind", "redux"
  ],
  data: [
    "sql", "python", "excel", "tableau", "power bi", "etl",
    "data analysis", "data visualization", "data modeling", "looker",
    "snowflake", "dbt", "statistics", "sqlite", "pandas", "bigquery"
  ],
  audio: [
    "pro tools", "logic pro", "ableton live", "ableton", "audio editing",
    "audio recording", "vocal tracking", "vocal production", "mixing",
    "mastering", "sound design", "live sound", "signal flow",
    "microphone placement", "studio sessions", "podcast production"
  ]
}; // end VOCAB

function clean(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
} // end clean

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
} // end escapeRegex

function containsPhrase(text, phrase) {
  return new RegExp(
    `(?<![a-z0-9])${escapeRegex(phrase)}(?![a-z0-9])`
  ).test(text);
} // end containsPhrase

export function withScores(jobs, track, skills) {
  const mine = [...new Set(skills.map(clean))];

  if (mine.length === 0) return jobs;

  const have = new Set(mine);
  const candidates = [...new Set([...(VOCAB[track] || []), ...mine])];

  return jobs.map((job) => {
    const text = clean(`${job.title || ""} ${job.description || ""}`);
    const detected = candidates.filter((word) => containsPhrase(text, word));

    if (detected.length < MIN_DETECTED) {
      return { ...job, matchScore: null, matchedSkills: [], missingSkills: [] };
    } // end if too little text

    const matchedSkills = detected.filter((word) => have.has(word));
    const missingSkills = detected.filter((word) => !have.has(word));

    return {
      ...job,
      matchScore: Math.round((matchedSkills.length / detected.length) * 100),
      matchedSkills,
      missingSkills
    };
  }); // end map
} // end withScores