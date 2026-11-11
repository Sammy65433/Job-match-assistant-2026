export const SENIOR_TITLE =
  /\b(senior|sr\.?|staff|principal|lead|head|director|manager|architect|vp|vice president|chief)\b/i;

export const ENTRY_TITLE =
  /\b(junior|jr\.?|entry[\s-]?level|associate|graduate|new grad)\b/i;

/* ---------- AI track title rules ----------
 * Requiring an AI topic plus a technical role keeps sales, training,
 * annotation, and medical-evaluation listings out of the developer track.
 */

const AI_TOPIC =
  /\b(?:ai|artificial intelligence|generative ai|gen ?ai|genai|machine learning|ml|deep learning|neural networks?|llms?|large language models?|prompt engineer(?:ing)?|conversational ai|computer vision|nlp|natural language processing|mlops|rag|retrieval[\s-]augmented generation|hugging ?face|openai)\b/i;

const AI_ROLE =
  /\b(?:engineers?|engineering|developers?|development|scientists?|programmers?|architects?|integrators?|consultants?|specialists?|interns?|apprentices?)\b/i;

const AI_EXCLUDE =
  /\b(?:account executives?|sales|business development|marketing|growth|recruiters?|recruiting|talent|human resources|hr|legal|counsel|finance|fp&a|accounting|physicians?|medical|clinical|nurses?|therapists?|psychiatrists?|pharmacists?|teachers?|professors?|instructors?|tutors?|trainers?|training|annotators?|annotation|reviewers?|writers?|copywriters?|editors?|translators?|transcription|customer success|research scientists?|applied scientists?)\b/i;

export function isAiTitle(title) {
  const text = typeof title === "string" ? title : "";

  if (!text || AI_EXCLUDE.test(text)) return false;

  return AI_TOPIC.test(text) && AI_ROLE.test(text);
} // end isAiTitle
