import { CACHE_TTL_MS } from "./config.js";
import { asHttpsUrl, repairText, stripHtml } from "./text.js";
import { isAiTitle } from "./titles.js";

const REMOTEOK_URL = "https://remoteok.com/api";
const CACHE_MS = CACHE_TTL_MS;

let cachedJobs = null;
let cachedAt = 0;
let pendingFetch = null;

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function fetchJobs() {
  const response = await fetch(REMOTEOK_URL, {
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`RemoteOK returned ${response.status}`);
  } // end if not ok

  const data = await response.json();
  const list = Array.isArray(data) ? data : [];

  return list
    .filter(
      (job) =>
        job &&
        typeof job === "object" &&
        !job.last_updated &&
        Boolean(job.id) &&
        Boolean(job.position)
    )
    .map((job) => ({
      id: `remotok-${job.id}`,
      title: repairText(job.position),
      company: repairText(job.company) || "Company not listed",
      category: cleanText(Array.isArray(job.tags) ? job.tags[0] : ""),
      location: repairText(job.location),
      url: asHttpsUrl(job.apply_url || job.url),
      description: repairText(stripHtml(job.description, 8000)),
      source: "RemoteOK",
      postedAt: Number.isFinite(Number(job.epoch))
        ? new Date(Number(job.epoch) * 1000).toISOString()
        : null
    }))
    .filter((job) => job.url);
} // end fetchJobs

export async function getRemoteOkJobs() {
  if (cachedJobs && Date.now() - cachedAt < CACHE_MS) {
    return cachedJobs;
  } // end if fresh

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
  } // end if no pending

  return pendingFetch;
} // end getRemoteOkJobs

const SENIOR_TITLE =
  /\b(senior|sr\.?|staff|principal|lead|tech lead|head of|director|manager|architect|vp|vice president|chief)\b/i;

const SOFTWARE_TITLE =
  /\b(software|developer|engineer|engineering|frontend|backend|full[\s-]?stack|web developer|react|vue|angular|node(?:\.js)?|typescript|javascript|python|java|c\+\+|golang|rust|devops|cloud|aws|azure|kubernetes|terraform)\b/i;

const DATA_TITLE =
  /\b(data|analyst|analytics|etl|scientist|machine learning|insights|reporting)\b/i;

export function selectRemoteOkJobs(jobs, track, limit = 100) {
  const titlePattern =
    track === "data" ? DATA_TITLE : track === "ai" ? null : SOFTWARE_TITLE;

  return jobs
    .filter((job) => !SENIOR_TITLE.test(job.title))
    .filter((job) =>
      track === "ai" ? isAiTitle(job.title) : titlePattern.test(job.title)
    )
    .slice(0, limit);
}
