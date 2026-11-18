/* Shared Google Gemini client for server-side text generation.
 * The API key never leaves the backend.
 */

const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

// Gemini 3.x Flash can hang when thinking is disabled, and the larger Flash
// tiers often return 503 under load. Flash-Lite responds reliably for these
// short text-generation tasks, so it is the default and the fallback.
const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const FALLBACK_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite"];
const MAX_ATTEMPT_MS = 12000;

export class GeminiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  } // end constructor
} // end GeminiError

export function geminiModel() {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
} // end geminiModel

function modelsToTry() {
  const primary = geminiModel();
  return [primary, ...FALLBACK_MODELS.filter((model) => model !== primary)];
} // end modelsToTry

function partsText(data) {
  if (!Array.isArray(data?.candidates?.[0]?.content?.parts)) return "";

  return data.candidates[0].content.parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("");
} // end partsText

function requestError(error) {
  if (error?.name === "TimeoutError") {
    return new GeminiError("The AI service timed out. Try again.", 504);
  } // end if timeout

  return new GeminiError("Could not reach the AI service.", 502);
} // end requestError

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

  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  for (const model of modelsToTry()) {
    const remaining = deadline - Date.now();

    if (remaining < 2000) break;

    const url = `${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent`;

    try {
      const response = await fetch(url, {
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
            topP: 0.9
          }
        }),
        signal: AbortSignal.timeout(Math.min(remaining, MAX_ATTEMPT_MS))
      });

      if (!response.ok) {
        const busy = response.status === 429 || response.status === 503;

        throw new GeminiError(
          busy
            ? "The AI service is busy. Try again in a minute."
            : "The AI service could not complete the request.",
          busy ? response.status : 502
        );
      } // end if not ok

      let data;

      try {
        data = await response.json();
      } catch {
        throw new GeminiError("The AI service returned an invalid response.", 502);
      } // end try/catch

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
    } catch (error) {
      const failure = error instanceof GeminiError ? error : requestError(error);

      // Authentication and safety blocks will not improve on another model.
      if ([401, 403, 422].includes(failure.status)) throw failure;

      lastError = failure;
    } // end try/catch
  } // end for

  throw lastError ??
    new GeminiError("The AI service could not complete the request.", 502);
} // end generateGeminiText
