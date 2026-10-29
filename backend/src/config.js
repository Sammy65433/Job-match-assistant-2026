export const TRACKS = ["software", "data", "audio"];

export const DISCOVERY_TRACKS = ["software", "data"];

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
