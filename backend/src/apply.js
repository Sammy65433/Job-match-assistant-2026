import { asHttpsUrl } from "./text.js";
import { validListingUrl, validSource, validSourceJobId } from "./validation.js";

const MAX_DESCRIPTION_LENGTH = 10000;

function parseBoardJobId(source, sourceJobId) {
  const normalizedSource = String(source || "").toLowerCase();
  const value = String(sourceJobId || "").toLowerCase();
  const prefix = `${normalizedSource}-`;

  if (!value.startsWith(prefix)) {
    return null;
  } // end if prefix

  const parts = value.split("-");
  const boardToken = parts[1];
  const jobId = parts[2];

  if (!boardToken || !jobId) {
    return null;
  } // end if parts

  return { boardToken, jobId };
} // end parseBoardJobId

async function submitGreenhouse(boardToken, jobId, title, description) {
  const boardTokenValue = process.env.GREENHOUSE_BOARD_TOKEN;

  if (!boardTokenValue) {
    return { ok: false, reason: "greenhouse-board-token-not-set" };
  } // end if not configured

  const basicAuth = Buffer.from(`${boardTokenValue}:`).toString("base64");

  try {
    const response = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
        boardToken
      )}/jobs/${encodeURIComponent(jobId)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          job: { id: Number(jobId) },
          candidate: {
            name: title,
            // ATS submission needs a real candidate profile; without one the
            // employer flow must stay on the public job URL.
            submittedVia: "job-posting"
          }
        }),
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      return { ok: false, reason: `greenhouse-${response.status}` };
    } // end if not ok

    return { ok: true };
  } catch {
    return { ok: false, reason: "greenhouse-error" };
  } // end try/catch
} // end submitGreenhouse

export async function submitListingApplication({
  source,
  sourceJobId,
  url,
  title,
  description
}) {
  const targetUrl = asHttpsUrl(url);

  if (!targetUrl) {
    return { submitted: false, url: null, source, fallbackToOpenUrl: true };
  } // end if invalid url

  let submitted = false;
  let atsSource = null;

  const boardJob = source && sourceJobId ? parseBoardJobId(source, sourceJobId) : null;

  if (boardJob && source === "Greenhouse") {
    const result = await submitGreenhouse(
      boardJob.boardToken,
      boardJob.jobId,
      title,
      description
    );

    if (result.ok) {
      submitted = true;
      atsSource = source;
    } // end if greenhouse ok
  } // end if greenhouse board job

  const descriptionText =
    typeof description === "string" ? description.trim().slice(0, MAX_DESCRIPTION_LENGTH) : "";

  return {
    submitted,
    source,
    url: targetUrl,
    atsSource,
    fallbackToOpenUrl: !submitted,
    ...(descriptionText
      ? { candidateNote: descriptionText.slice(0, 500) }
      : {})
  };
} // end submitListingApplication
