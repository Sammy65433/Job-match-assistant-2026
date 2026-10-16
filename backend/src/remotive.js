const REMOTIVE_URL = "https://remotive.com/api/remote-jobs";
const CACHE_MS = 6 * 60 * 60 * 1000;

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
      title: job.title,
      company: job.company_name,
      category: job.category,
      location: job.candidate_required_location,
      tags: Array.isArray(job.tags) ? job.tags : [],
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
