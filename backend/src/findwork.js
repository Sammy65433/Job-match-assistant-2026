import { asHttpsUrl, stripHtml } from "./text.js";

const FINDWORK_URL = "https://findwork.dev/api/jobs/";

const KEYWORDS = {
  software: "software engineer",
  data: "data analyst"
};

export async function getFindworkJobs({ track, remote = true }) {
  const apiKey = process.env.FINDWORK_API_KEY;

  if (!apiKey) {
    throw new Error("FINDWORK_API_KEY is not configured.");
  } // end if missing

  const keyword = KEYWORDS[track];
  if (!keyword) return [];

  const url = new URL(FINDWORK_URL);
  url.searchParams.set("search", keyword);
  if (remote) url.searchParams.set("remote", "true");

  const response = await fetch(url, {
    headers: { Authorization: `Token ${apiKey}` },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`Findwork returned ${response.status}`);
  } // end if not ok

  const data = await response.json();
  const list = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data)
      ? data
      : [];

  return list
    .map((job) => ({
      id: `findwork-${job.id || job.url}`,
      title: job.role || job.title || "",
      company:
        job.company_name || job.company?.name || "Company not listed",
      location: job.location || (job.remote ? "Remote" : ""),
      description: stripHtml(job.text || job.description),
      url: asHttpsUrl(job.url),
      source: "Findwork",
      postedAt: job.date_posted || null
    }))
    .filter((job) => job.url);
} // end getFindworkJobs
