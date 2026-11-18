export const SENIOR_TITLE =
  /\b(senior|sr\.?|staff|principal|lead|head|director|manager|architect|vp|vice president|chief)\b/i;

export const ENTRY_TITLE =
  /\b(junior|jr\.?|entry[\s-]?level|associate|graduate|new grad(?:uate)?s?|early[\s-]?career|intern(?:ship)?|apprentice(?:ship)?|0\s*[-–]\s*2 years?)\b/i;

/* Descriptive text is checked separately with stricter phrases so a mention
 * of an "associate degree" or "graduate program" is not read as a job level.
 */
const ENTRY_DESCRIPTION =
  /\b(entry[\s-]?level|new grad(?:uate)?s?|early[\s-]?career|0\s*[-–]\s*2 years?(?: of)? experience|junior (?:role|position|engineer|analyst|developer)|internship|apprenticeship)\b/i;

export function isExplicitEntryLevel(title, description = "") {
  return (
    ENTRY_TITLE.test(String(title || "")) ||
    ENTRY_DESCRIPTION.test(String(description || ""))
  );
} // end isExplicitEntryLevel

/* ---------- AI track title rules ----------
 * Requiring an AI topic plus a technical role keeps sales, training,
 * annotation, and medical-evaluation listings out of the developer track.
 */

const AI_TOPIC =
  /\b(?:ai|artificial intelligence|generative ai|gen ?ai|genai|machine learning|ml|deep learning|neural networks?|llms?|large language models?|prompt engineer(?:ing)?|conversational ai|computer vision|nlp|natural language processing|mlops|rag|retrieval[\s-]augmented generation|hugging ?face|openai)\b/i;

const AI_ROLE =
  /\b(?:engineers?|engineering|developers?|development|scientists?|programmers?|architects?|integrators?|consultants?|specialists?|interns?|apprentices?)\b/i;

/* AI engineer is narrower than the solutions-developer track: it keeps
 * engineering/development titles and drops scientist, consultant, and
 * specialist roles that usually require research or pre-sales work.
 */
const AI_ENGINEER_ROLE =
  /\b(?:engineers?|engineering|developers?|development|programmers?|architects?|mlops|integrators?)\b/i;

const AI_EXCLUDE =
  /\b(?:account executives?|sales|business development|marketing|growth|recruiters?|recruiting|talent|human resources|hr|legal|counsel|finance|fp&a|accounting|physicians?|medical|clinical|nurses?|therapists?|psychiatrists?|pharmacists?|teachers?|professors?|instructors?|tutors?|trainers?|training|annotators?|annotation|reviewers?|writers?|copywriters?|editors?|translators?|transcription|customer success|research scientists?|applied scientists?)\b/i;

export function isAiTitle(title) {
  const text = typeof title === "string" ? title : "";

  if (!text || AI_EXCLUDE.test(text)) return false;

  return AI_TOPIC.test(text) && AI_ROLE.test(text);
} // end isAiTitle

export function isAiEngineerTitle(title) {
  const text = typeof title === "string" ? title : "";

  if (!text || AI_EXCLUDE.test(text)) return false;

  return AI_TOPIC.test(text) && AI_ENGINEER_ROLE.test(text);
} // end isAiEngineerTitle
