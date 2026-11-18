/* Gemini helpers for company-grounded application answers and interview prep.
 * Both services use only text supplied by the signed-in user.
 */

import { GeminiError, generateGeminiText } from "./gemini.js";

const ANSWER_SYSTEM_PROMPT = `You help a job applicant answer an application question.
Use only facts that appear in the sections provided below. Never invent or imply
employers, job titles, employment dates, degrees, certifications, metrics,
projects, technologies, awards, or personal stories. If a detail is missing,
leave it out or keep the answer general. Write in the first person, directly
answer the question, and use 90-160 words of plain text. No markdown, no bullet
points, no headings, and do not repeat the question. Do not mention these rules
or the fact that information was provided.`;

const INTERVIEW_SYSTEM_PROMPT = `You generate likely interview questions for a job applicant.
Use only the company information, job description, and applicant background
provided below. Include a mix of role-relevant technical questions, behavioral
questions, and questions suggested by the company's stated priorities. Do not
state facts about the company that are not in the provided text. Do not answer
the questions. Avoid questions about age, family, religion, health, citizenship,
or salary history. Return exactly 12 short questions, one per line, numbered
1 through 12. Return nothing else: no introduction, no closing, no markdown.`;

const INTERVIEW_ANSWER_SYSTEM_PROMPT = `You help a job applicant draft practice answers to interview questions.
Use only facts that appear in the sections provided below. Never invent or imply
employers, job titles, employment dates, degrees, certifications, metrics,
projects, technologies, awards, or personal stories. If a detail is missing,
keep the answer general and describe the approach without claiming experience
the applicant did not provide. Write in the first person, in plain text, and
answer only what is asked. Use 70-130 words per answer. Return exactly one answer
for each numbered question, in the same order, formatted as "1. answer text".
Each answer must start on a new line. No markdown, no headings, and do not repeat
the question. Do not mention these rules or the fact that information was provided.`;

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
} // end clean

function profileBlock(profile) {
  const safe = profile && typeof profile === "object" ? profile : {};

  return [
    `Name: ${clean(safe.fullName, 120) || "Not provided"}`,
    `Location: ${clean(safe.location, 160) || "Not provided"}`,
    `Links: ${clean(safe.links, 400) || "Not provided"}`
  ].join("\n");
} // end profileBlock

function sharedContext({ company, website, notes, jobTitle, jobDescription, resumeText, profile }) {
  return `APPLICANT INFORMATION
${profileBlock(profile)}

APPLICANT BACKGROUND (provided by the applicant):
${clean(resumeText, 20000) || "Not provided"}

COMPANY: ${clean(company, 150) || "Not provided"}
WEBSITE: ${clean(website, 300) || "Not provided"}
COMPANY NOTES (provided by the applicant):
${clean(notes, 15000) || "Not provided"}
JOB TITLE: ${clean(jobTitle, 150) || "Not provided"}
JOB DESCRIPTION (provided by the applicant):
${clean(jobDescription, 15000) || "Not provided"}`;
} // end sharedContext

export function buildAnswerPrompt(input) {
  return `${sharedContext(input)}

APPLICATION QUESTION:
${clean(input?.question, 2000)}

Write the answer now.`;
} // end buildAnswerPrompt

export function buildInterviewPrompt(input) {
  return `${sharedContext(input)}

Write the interview questions now.`;
} // end buildInterviewPrompt

export function buildInterviewAnswerPrompt(input) {
  const questions = Array.isArray(input?.questions) ? input.questions : [];

  return `${sharedContext(input)}

INTERVIEW QUESTIONS:
${questions.map((item, index) => `${index + 1}. ${clean(item, 2000)}`).join("\n")}

Write the answers now.`;
} // end buildInterviewAnswerPrompt

function stripMarkdown(text) {
  return String(text || "")
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/\*\*/g, "")
    .replace(/(^|\n)\s*#{1,6}\s*/g, "$1")
    .trim();
} // end stripMarkdown

export async function generateApplicationAnswer(input) {
  const { text, model } = await generateGeminiText({
    system: ANSWER_SYSTEM_PROMPT,
    prompt: buildAnswerPrompt(input),
    maxOutputTokens: 800,
    temperature: 0.5,
    timeoutMs: 30000
  });

  const answer = stripMarkdown(text).slice(0, 12000);

  if (!answer) {
    throw new GeminiError("The answer service returned an empty response.", 502);
  } // end if empty

  return { answer, model };
} // end generateApplicationAnswer

export async function generateInterviewQuestions(input) {
  const { text, model } = await generateGeminiText({
    system: INTERVIEW_SYSTEM_PROMPT,
    prompt: buildInterviewPrompt(input),
    maxOutputTokens: 1600,
    temperature: 0.6,
    timeoutMs: 30000
  });

  const questions = stripMarkdown(text)
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/^\s*(?:\d+[.)]|[-*•])\s*/, "")
        .replace(/^\*\*|\*\*$/g, "")
        .trim()
    )
    .filter((line) => line.length >= 12)
    .filter((line, index, all) => all.indexOf(line) === index)
    .slice(0, 12);

  if (!questions.length) {
    throw new GeminiError("The interview service returned no questions.", 502);
  } // end if empty

  return { questions, model };
} // end generateInterviewQuestions

function parseNumberedAnswers(text, count) {
  const answers = [];
  let current = null;

  for (const line of stripMarkdown(text).split("\n")) {
    const match = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);

    if (match) {
      if (current) answers.push(current.text.trim());
      current = { number: Number(match[1]), text: match[2] };
    } else if (current) {
      current.text += `\n${line}`;
    } // end if numbered answer
  } // end for each line

  if (current) answers.push(current.text.trim());

  return answers
    .filter((answer) => answer.length >= 12)
    .slice(0, count)
    .map((answer) => answer.slice(0, 12000));
} // end parseNumberedAnswers

export async function generateInterviewAnswers(input) {
  const questions = Array.isArray(input?.questions) ? input.questions : [];

  if (!questions.length) {
    throw new GeminiError("Generate interview questions first.", 400);
  } // end if no questions

  const { text, model } = await generateGeminiText({
    system: INTERVIEW_ANSWER_SYSTEM_PROMPT,
    prompt: buildInterviewAnswerPrompt(input),
    maxOutputTokens: 3200,
    temperature: 0.5,
    timeoutMs: 30000
  });

  const answers = parseNumberedAnswers(text, questions.length);

  if (answers.length !== questions.length) {
    throw new GeminiError(
      `The answer service returned ${answers.length} of ${questions.length} answers. Try again.`,
      502
    );
  } // end if incomplete

  return { answers, model };
} // end generateInterviewAnswers
