import { CACHE_TTL_MS } from "./config.js";

const REMOTIVE_URL = "https://remotive.com/api/remote-jobs";
const CACHE_MS = CACHE_TTL_MS;

let cachedJobs = null;
let cachedAt = 0;
let pendingFetch = null;

function validRemotiveUrl(value) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname === "remotive.com" &&
      url.pathname.startsWith("/remote-jobs/")
    );
  } catch {
    return false;
  }
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function fetchJobs() {
  const response = await fetch(REMOTIVE_URL, {
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`Remotive returned ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data.jobs)) {
    throw new Error("Unexpected Remotive response.");
  }

  return data.jobs
    .filter((job) => validRemotiveUrl(job.url))
    .map((job) => ({
      id: String(job.id),
      title: cleanText(job.title),
      company: cleanText(job.company_name),
      category: cleanText(job.category),
      location: cleanText(job.candidate_required_location),
      url: job.url,
      source: "Remotive"
    }));
}

export async function getRemotiveJobs() {
  if (cachedJobs && Date.now() - cachedAt < CACHE_MS) {
    return cachedJobs;
  }

  if (!pendingFetch) {
    pendingFetch = fetchJobs()
      .then((jobs) => {
        cachedJobs = jobs;
        cachedAt = Date.now();
        return jobs;
      })
      .finally(() => {
        pendingFetch = null;
      });
  }

  return pendingFetch;
}

const SENIOR_TITLE =
  /\b(senior|sr\.?|staff|principal|lead|tech lead|head of|director|manager|architect)\b/i;

const SOFTWARE_TITLE =
  /\b(software|frontend|front-end|backend|back-end|full.?stack|web developer|react|javascript|node\.?js)\b/i;

const DATA_TITLE =
  /\b(data analyst|business analyst|business intelligence|bi analyst|reporting analyst|analytics analyst|etl analyst)\b/i;

const SOFTWARE_CATEGORY = /software/i;

export function selectRemotiveJobs(jobs, track, limit = 100) {
  if (track !== "software" && track !== "data") {
    return [];
  } // end if invalid track

  return jobs
    .filter((job) => {
      if (SENIOR_TITLE.test(job.title)) return false;

      if (track === "software") {
        return (
          SOFTWARE_CATEGORY.test(job.category) &&
          SOFTWARE_TITLE.test(job.title)
        );
      } // end if software

      return DATA_TITLE.test(job.title);
    }) // end filter
    .slice(0, limit);
} // end selectRemotiveJobs
