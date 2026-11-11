/* Skill vocabularies used for fit scoring and resume comparisons.
 * Related spellings share one group so a listing that says "LLM" still
 * matches someone whose profile says "large language models".
 */

const SKILL_GROUPS = {
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
  ],
  ai: [
    ["python"],
    ["generative ai", "genai", "gen ai"],
    ["large language models", "large language model", "llms", "llm"],
    ["prompt engineering", "prompt engineer", "prompting"],
    ["ai application development", "application development", "app development"],
    ["openai", "openai api"],
    ["hugging face", "huggingface"],
    ["rest api", "rest apis", "api", "apis"],
    ["json"],
    ["git"],
    ["github"],
    ["uv"],
    ["testing", "pytest", "unit testing", "unit tests"],
    ["debugging", "debug"],
    ["responsible ai", "ai ethics"],
    ["pandas"],
    ["streamlit"],
    ["machine learning"],
    ["deep learning"],
    ["nlp", "natural language processing"],
    ["computer vision"],
    ["embeddings"],
    ["vector databases", "vector database", "vector db"],
    ["langchain"],
    ["llamaindex", "llama index"],
    ["fastapi"],
    ["flask"],
    ["django"],
    ["model evaluation"],
    ["fine-tuning", "fine tuning"],
    ["transformers"],
    ["pytorch"],
    ["tensorflow"],
    ["scikit-learn", "scikit learn", "sklearn"],
    ["numpy"],
    ["jupyter"],
    ["docker"],
    ["aws"],
    ["azure"],
    ["gcp"],
    ["sql"],
    ["rag", "retrieval augmented generation"]
  ]
}; // end SKILL_GROUPS

export function cleanSkill(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/\s+/g, " ")
    : "";
} // end cleanSkill

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
} // end escapeRegex

export function containsPhrase(text, phrase) {
  return new RegExp(
    `(?<![a-z0-9])${escapeRegex(phrase)}(?![a-z0-9])`
  ).test(text);
} // end containsPhrase

export function buildSkillGroups(track, skills = []) {
  const groups = [];
  const alias = new Map();

  function addGroup(patterns) {
    const cleaned = [...new Set(patterns.map(cleanSkill).filter(Boolean))];
    if (!cleaned.length) return;

    const key = cleaned[0];
    groups.push({ key, patterns: cleaned });
    cleaned.forEach((pattern) => {
      if (!alias.has(pattern)) alias.set(pattern, key);
    });
  } // end addGroup

  (SKILL_GROUPS[track] || []).forEach((entry) => {
    addGroup(Array.isArray(entry) ? entry : [entry]);
  });

  const extras = [...new Set((skills || []).map(cleanSkill).filter(Boolean))];
  extras.forEach((skill) => {
    if (!alias.has(skill)) addGroup([skill]);
  });

  return { groups, alias };
} // end buildSkillGroups

export function matchGroups(text, groups, have) {
  const detected = groups.filter((group) =>
    group.patterns.some((pattern) => containsPhrase(text, pattern))
  );
  const missing = detected.filter((group) => !have.has(group.key));

  return {
    detected: detected.map((group) => group.key),
    matched: detected
      .filter((group) => have.has(group.key))
      .map((group) => group.key),
    missing: missing.map((group) => group.key)
  };
} // end matchGroups
