import { asHttpsUrl, stripHtml } from "./text.js";

const REMOSHIFT_URL = "https://remoshift.com/api/v1/jobs.open";

const QUERIES = {
  software: "software engineer",
  data: "data analyst"
};

export async function getRemoShiftJobs(track) {
  const query = QUERIES[track];
  if (!query) return [];

  const url = new URL(REMOSHIFT_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("per", "25");

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`RemoShift returned ${response.status}`);
  } // end if not ok

  const data = await response.json();
  const list = Array.isArray(data)
    ? data
    : data?.jobs || data?.data || data?.results || [];

  return list
    .map((job) => ({
      id: `remoshift-${job.id || job.detail_url}`,
      title: job.title || "",
      company: job.company || "Company not listed",
      location:
        job.location ||
        (job.work_anywhere ? "Remote (work from anywhere)" : "Remote"),
      description: stripHtml(job.description || job.summary || job.excerpt),
      url: asHttpsUrl(job.apply_url || job.detail_url),
      source: "RemoShift",
      postedAt: job.posted_at || null
    }))
    .filter((job) => job.url);
} // end getRemoShiftJobs
