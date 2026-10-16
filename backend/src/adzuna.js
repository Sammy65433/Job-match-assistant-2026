const BASE_URL = "https://api.adzuna.com/v1/api/jobs/us/search/1";

const SEARCHES = {
  los_angeles: {
    label: "Los Angeles area",
    where: "Los Angeles, CA"
  },
  newark: {
    label: "Newark area",
    where: "Newark, NJ"
  }
};

const cache = new Map();
const CACHE_MS = 60 * 60 * 1000;

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

  const jobs = data.results
    .filter((job) => {
      try {
        return new URL(job.redirect_url).protocol === "https:";
      } catch {
        return false;
      }
    })
    .map((job) => ({
      id: `adzuna-${job.id}`,
      title: job.title || "",
      company: job.company?.display_name || "Company not listed",
      location: job.location?.display_name || search.label,
      description: job.description || "",
      postedAt: job.created || null,
      url: job.redirect_url,
      source: "Adzuna"
    }));

  cache.set(area, { time: Date.now(), jobs });
  return jobs;
}
