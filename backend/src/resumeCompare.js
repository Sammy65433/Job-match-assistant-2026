const MAX_RESUME_LENGTH = 20000;
const MAX_REQUIREMENTS = 30;

function normalize(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
} // end normalize

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
} // end escapeRegex

// Matches the phrase only when it is not glued to other letters or digits.
// "java" will not match inside "javascript", and "sql" will not match "mysql".
// Works for phrases with symbols too, like "c++", "c#", and "node.js".
function containsPhrase(text, phrase) {
  const pattern = new RegExp(
    `(?<![a-z0-9])${escapeRegex(phrase)}(?![a-z0-9])`
  );
  return pattern.test(text);
} // end containsPhrase

export function compareResume(body) {
  const { resumeText, requirements } = body ?? {};

  if (
    typeof resumeText !== "string" ||
    !resumeText.trim() ||
    resumeText.length > MAX_RESUME_LENGTH ||
    !Array.isArray(requirements) ||
    requirements.length === 0 ||
    requirements.length > MAX_REQUIREMENTS ||
    !requirements.every(
      (item) =>
        typeof item === "string" &&
        item.trim().length > 0 &&
        item.length <= 300
    )
  ) {
    return {
      error:
        "Provide resumeText and 1 to 30 manually reviewed requirements."
    };
  } // end if invalid body

  const resume = normalize(resumeText);

  const results = requirements.map((item) => {
    const requirement = item.trim();
    const exactPhraseFound = containsPhrase(resume, normalize(requirement));

    return {
      requirement,
      status: "needs-review",
      exactPhraseFound,
      explanation: exactPhraseFound
        ? "The phrase appears in the resume. Review the context before marking it supported."
        : "The phrase was not found as a whole word or phrase. This does not establish that the requirement is missing."
    };
  }); // end map

  return {
    requirements: results,
    note:
      "No qualification score is calculated. A person must review evidence and the full job listing."
  };
} // end compareResume