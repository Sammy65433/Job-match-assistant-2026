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
    ["pro tools", "protools", "avid pro tools"],
    ["logic pro", "logic pro x", "logicpro"],
    ["ableton live", "ableton", "ableton live suite"],
    ["audio engineering", "audio engineer", "recording engineer", "sound engineer"],
    ["audio editing", "audio editor", "audio post production", "audio post-production"],
    ["audio recording", "recording", "record audio", "audio capture"],
    ["vocal tracking", "vocal recording", "voice tracking", "voice recording"],
    ["vocal production", "voice production"],
    ["vocal tuning", "pitch correction", "autotune", "auto-tune"],
    ["mixing", "audio mixing", "mix engineer", "mixdown", "mix-down"],
    ["mastering", "audio mastering", "mastering engineer"],
    ["sound design", "sound designer", "sound effects", "sfx"],
    ["live sound", "live audio", "front of house", "foh", "monitor engineer"],
    ["signal flow", "signal chain", "audio routing"],
    ["microphone placement", "mic placement", "microphone technique", "mic setup"],
    ["studio sessions", "studio session", "studio recording"],
    ["podcast production", "podcast editing", "podcasting"],
    ["digital audio workstation", "daw"],
    ["music production", "music producer", "composition"],
    ["eq", "equalization"],
    ["compression", "audio compression"],
    ["reverb", "delay"],
    ["session file organization", "session organization", "session backups"]
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
  ],
  "ai-engineer": [
    ["python"],
    ["generative ai", "genai", "gen ai"],
    ["large language models", "large language model", "llms", "llm"],
    ["prompt engineering", "prompt engineer", "prompting"],
    ["machine learning", "ml"],
    ["deep learning"],
    ["nlp", "natural language processing"],
    ["computer vision"],
    ["rag", "retrieval augmented generation"],
    ["embeddings"],
    ["vector databases", "vector database", "vector db", "pinecone", "weaviate", "pgvector"],
    ["langchain"],
    ["llamaindex", "llama index"],
    ["openai", "openai api"],
    ["hugging face", "huggingface"],
    ["transformers"],
    ["pytorch"],
    ["tensorflow"],
    ["scikit-learn", "scikit learn", "sklearn"],
    ["model evaluation", "model evals", "llm evaluation", "evals"],
    ["fine-tuning", "fine tuning"],
    ["mlops"],
    ["model deployment", "deploy models", "model serving"],
    ["fastapi"],
    ["flask"],
    ["django"],
    ["rest api", "rest apis"],
    ["json"],
    ["docker"],
    ["kubernetes"],
    ["aws", "amazon web services"],
    ["azure"],
    ["gcp", "google cloud"],
    ["sql"],
    ["spark", "pyspark"],
    ["airflow"],
    ["pandas"],
    ["numpy"],
    ["streamlit"],
    ["git"],
    ["github"],
    ["ci/cd", "continuous integration"],
    ["uv"],
    ["testing", "pytest", "unit testing", "unit tests"],
    ["debugging", "debug"],
    ["responsible ai", "ai ethics"],
    ["jupyter"]
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
