export const TRACKS = ["software", "data", "audio", "ai", "ai-engineer"];

export const DISCOVERY_TRACKS = ["software", "data", "ai", "ai-engineer"];

export const AREAS = ["los_angeles", "newark"];

export const AUDIO_MODES = ["in-person", "hybrid", "remote"];

export const STATUSES = [
  "saved",
  "ready",
  "applied",
  "interview",
  "closed",
  "rejected"
];

export const SOURCES = [
  "Remotive",
  "RemoteOK",
  "Hacker News",
  "Jobicy",
  "Himalayas",
  "Adzuna",
  "The Muse",
  "Jooble",
  "Greenhouse",
  "Lever",
  "Ashby",
  "SmartRecruiters",
  "Workable",
  "Arbeitnow",
  "RemoShift",
  "RemoteJobs.org",
  "USAJOBS",
  "Reed",
  "Findwork"
];

export const HOUR_MS = 60 * 60 * 1000;

function configuredRefreshHours() {
  const hours = Number(process.env.JOB_REFRESH_HOURS);
  return Number.isFinite(hours) && hours >= 1 && hours <= 168 ? hours : 12;
} // end configuredRefreshHours

export const CACHE_TTL_HOURS = configuredRefreshHours();

export const CACHE_TTL_MS = CACHE_TTL_HOURS * HOUR_MS;

/* Jooble enforces tighter request quotas than the other sources. Keep its
 * results longer and reuse the last successful response if a refresh is
 * rejected with a rate-limit error.
 */
export const JOOBLE_CACHE_MS = 24 * HOUR_MS;
export const JOOBLE_STALE_MS = 72 * HOUR_MS;
