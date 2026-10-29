import { detectWorkMode } from "./workMode.js";
import { cached } from "./cache.js";
import { CACHE_TTL_MS } from "./config.js";

const BASE_URL = "https://api.adzuna.com/v1/api/jobs/us/search/1";

const SEARCHES = {
  los_angeles: {
    label: "Los Angeles area",
    where: "Los Angeles, CA"
  },
  newark: {
    label: "Newark / NYC area",
    where: "Newark, NJ"
  }
};

const STRONG_TITLE =
  /\b(audio (production )?engineer|recording engineer|sound engineer|mix(ing)? engineer|audio editor|podcast (producer|editor)|studio engineer|vocal producer)\b/i;

const RELATED_TITLE =
  /\b(audio|sound|recording|music produc(er|tion)|broadcast|studio|post.production)\b/i;

const STUDIO_CONTEXT =
  /\b(recording sessions?|vocal tracking|audio editing|mixing|pro tools|recording studio|podcast (editing|production)|live sound)\b/i;

const UNRELATED_TITLE =
  /\b(voice coach|bilingual|translator|animator|gameplay|data scientist|software engineer|quality engineer|acoustic engineer|sales manager|program manager|art director)\b/i;

const AUDIO_MODES = ["in-person", "hybrid", "remote"];

function classifyAudioJob(job) {
  const title = String(job.title || "");
  const description = String(job.description || "");

  if (UNRELATED_TITLE.test(title)) {
    return {
      relevance: "other",
      reason: "The title suggests a different specialty."
    };
  }

  if (STRONG_TITLE.test(title) && STUDIO_CONTEXT.test(description)) {
    return {
      relevance: "likely-related",
      reason: "The title and preview mention recording or audio-production work."
    };
  }

  if (STRONG_TITLE.test(title) || RELATED_TITLE.test(title)) {
    return {
      relevance: "review",
      reason: "The title is audio-related; check the full requirements."
    };
  }

  return {
    relevance: "other",
    reason: "The preview does not clearly indicate an audio-production role."
  };
} // end classifyAudioJob

function validRedirectUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
} // end validRedirectUrl

function credentials() {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error("Adzuna credentials are not configured.");
  } // end if missing

  return { appId, appKey };
} // end credentials

async function fetchAdzuna(params) {
  const { appId, appKey } = credentials();
  const url = new URL(BASE_URL);

  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    } // end if set
  });

  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

  if (!response.ok) {
    throw new Error(`Adzuna returned ${response.status}`);
  } // end if not ok

  const data = await response.json();

  if (!Array.isArray(data.results)) {
    throw new Error("Unexpected Adzuna response.");
  } // end if unexpected

  return data.results;
} // end fetchAdzuna

export async function searchAdzunaAudioJobs(area, mode = "in-person") {
  const search = SEARCHES[area];

  if (!search) {
    throw new Error("Invalid audio search area.");
  }

  if (!AUDIO_MODES.includes(mode)) {
    throw new Error("Invalid audio work type.");
  }

  const cacheKey = `adzuna-audio|${area}|${mode}`;

  return cached(cacheKey, CACHE_TTL_MS, async () => {
    const results = await fetchAdzuna({
      what: mode === "in-person" ? "audio engineer" : `audio engineer ${mode}`,
      ...(mode === "remote"
        ? {}
        : { where: search.where, distance: "40" }),
      results_per_page: "30",
      sort_by: "date"
    });

    const relevanceOrder = {
      "likely-related": 0,
      review: 1,
      other: 2
    };

    return results
      .filter((job) => validRedirectUrl(job.redirect_url))
      .map((job) => ({
        id: `adzuna-${job.id}`,
        title: job.title || "",
        company: job.company?.display_name || "Company not listed",
        location: job.location?.display_name || search.label,
        description: job.description || "",
        postedAt: job.created || null,
        url: job.redirect_url,
        source: "Adzuna",
        ...classifyAudioJob(job)
      }))
      .map((job) => ({ ...job, workMode: detectWorkMode(job) }))
      .filter((job) => job.workMode === mode)
      .sort((a, b) => relevanceOrder[a.relevance] - relevanceOrder[b.relevance]);
  });
} // end searchAdzunaAudioJobs

export async function searchAdzunaJobs(what, area) {
  const search = SEARCHES[area];

  if (!search) {
    throw new Error("Invalid search area.");
  } // end if invalid area

  const cacheKey = `adzuna-search|${what}|${area}`;

  return cached(cacheKey, CACHE_TTL_MS, async () => {
    const results = await fetchAdzuna({
      what,
      where: search.where,
      distance: "40",
      results_per_page: "50",
      sort_by: "date"
    });

    return results
      .filter((job) => validRedirectUrl(job.redirect_url))
      .map((job) => ({
        id: `adzuna-${job.id}`,
        title: job.title || "",
        company: job.company?.display_name || "Company not listed",
        location: job.location?.display_name || search.label,
        description: job.description || "",
        url: job.redirect_url,
        source: "Adzuna"
      }));
  });
} // end searchAdzunaJobs
