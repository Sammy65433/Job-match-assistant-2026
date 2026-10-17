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

const cache = new Map();
const CACHE_MS = 60 * 60 * 1000;

const STRONG_TITLE =
  /\b(audio (production )?engineer|recording engineer|sound engineer|mix(ing)? engineer|audio editor|podcast (producer|editor)|studio engineer|vocal producer)\b/i;

const RELATED_TITLE =
  /\b(audio|sound|recording|music produc(er|tion)|broadcast|studio|post.production)\b/i;

const STUDIO_CONTEXT =
  /\b(recording sessions?|vocal tracking|audio editing|mixing|pro tools|recording studio|podcast (editing|production)|live sound)\b/i;

const UNRELATED_TITLE =
  /\b(voice coach|bilingual|translator|animator|gameplay|data scientist|software engineer|quality engineer|acoustic engineer|sales manager|program manager|art director)\b/i;

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
}

function validRedirectUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function searchAdzunaAudioJobs(area) {
  const search = SEARCHES[area];

  if (!search) {
    throw new Error("Invalid audio search area.");
  }

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error("Adzuna credentials are not configured.");
  }

  const cached = cache.get(area);

  if (cached && Date.now() - cached.time < CACHE_MS) {
    return cached.jobs;
  }

  const url = new URL(BASE_URL);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("what", "audio engineer");
  url.searchParams.set("where", search.where);
  url.searchParams.set("distance", "40");
  url.searchParams.set("results_per_page", "20");
  url.searchParams.set("sort_by", "date");

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`Adzuna returned ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data.results)) {
    throw new Error("Unexpected Adzuna response.");
  }

  const relevanceOrder = {
    "likely-related": 0,
    review: 1,
    other: 2
  };

  const jobs = data.results
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
    .sort(
      (a, b) =>
        relevanceOrder[a.relevance] - relevanceOrder[b.relevance]
    );

  cache.set(area, { time: Date.now(), jobs });
  return jobs;
}
export async function searchAdzunaJobs(what, area) {
  const search = SEARCHES[area];

  if (!search) {
    throw new Error("Invalid search area.");
  } // end if invalid area

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error("Adzuna credentials are not configured.");
  } // end if no credentials

  const cacheKey = `${what}|${area}`;
  const hit = cache.get(cacheKey);

  if (hit && Date.now() - hit.time < CACHE_MS) {
    return hit.jobs;
  } // end if cached

  const url = new URL(BASE_URL);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("what", what);
  url.searchParams.set("where", search.where);
  url.searchParams.set("distance", "40");
  url.searchParams.set("results_per_page", "50");
  url.searchParams.set("sort_by", "date");

  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

  if (!response.ok) {
    throw new Error(`Adzuna returned ${response.status}`);
  } // end if not ok

  const data = await response.json();

  if (!Array.isArray(data.results)) {
    throw new Error("Unexpected Adzuna response.");
  } // end if unexpected

  const jobs = data.results
    .filter((job) => validRedirectUrl(job.redirect_url))
    .map((job) => ({
      id: `adzuna-${job.id}`,
      title: job.title || "",
      company: job.company?.display_name || "Company not listed",
      location: job.location?.display_name || search.label,
      description: job.description || "",
      url: job.redirect_url,
      source: "Adzuna"
    })); // end map

  cache.set(cacheKey, { time: Date.now(), jobs });
  return jobs;
} // end searchAdzunaJobs