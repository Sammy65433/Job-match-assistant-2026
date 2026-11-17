/* Shared Google Gemini client for server-side text generation.
 * The API key never leaves the backend.
 */

const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  } // end constructor
} // end GeminiError

export function geminiModel() {
  return process.env.GEMINI_MODEL || "gemini-3.5-flash";
} // end geminiModel

function partsText(data) {
  if (!Array.isArray(data?.candidates?.[0]?.content?.parts)) return "";

  return data.candidates[0].content.parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("");
} // end partsText

export async function generateGeminiText({
  system,
  prompt,
  maxOutputTokens = 1600,
  temperature = 0.55,
  timeoutMs = 30000
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiError(
      "AI generation is not configured. Add GEMINI_API_KEY to the backend environment.",
      503
    );
  } // end if no key

  const model = geminiModel();
  const url = `${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent`;

  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: system }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature,
          maxOutputTokens,
          topP: 0.9,
          // Gemini 3 models otherwise spend the token budget on thinking and
          // can return an empty candidate.
          thinkingConfig: { thinkingBudget: 0 }
        }
      }),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    throw new GeminiError(
      error?.name === "TimeoutError"
        ? "The AI service timed out. Try again."
        : "Could not reach the AI service.",
      error?.name === "TimeoutError" ? 504 : 502
    );
  } // end try/catch

  if (!response.ok) {
    throw new GeminiError(
      response.status === 429
        ? "The AI service is busy. Try again in a minute."
        : "The AI service could not complete the request.",
      response.status === 429 ? 429 : 502
    );
  } // end if not ok

  const data = await response.json();

  if (data?.promptFeedback?.blockReason) {
    throw new GeminiError(
      "The request was blocked. Remove sensitive details and try again.",
      422
    );
  } // end if blocked

  const text = partsText(data).trim();

  if (!text) {
    throw new GeminiError("The AI service returned an empty response.", 502);
  } // end if empty

  return { text, model };
} // end generateGeminiText
