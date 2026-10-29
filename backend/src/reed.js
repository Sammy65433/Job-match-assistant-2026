import { asHttpsUrl, stripHtml } from "./text.js";

const REED_URL = "https://www.reed.co.uk/api/1.0/search";

const KEYWORDS = {
  software: "software engineer",
  data: "data analyst"
};

export async function getReedJobs({ track, remote = true }) {
  const apiKey = process.env.REED_API_KEY;

  if (!apiKey) {
    throw new Error("REED_API_KEY is not configured.");
  } // end if missing

  const keyword = KEYWORDS[track];
  if (!keyword) return [];

  const url = new URL(REED_URL);
  url.searchParams.set("keywords", keyword);
  url.searchParams.set("resultsToTake", "50");
  if (remote) url.searchParams.set("remotejob", "true");

  const auth = Buffer.from(`${apiKey}:`).toString("base64");

  const response = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`Reed returned ${response.status}`);
  } // end if not ok

  const data = await response.json();
  const list = Array.isArray(data?.results) ? data.results : [];

  return list
    .map((job) => ({
      id: `reed-${job.jobId}`,
      title: job.jobTitle || "",
      company: job.employerName || "Company not listed",
      location: job.locationName || "",
      description: stripHtml(job.jobDescription),
      url: asHttpsUrl(job.jobUrl),
      source: "Reed",
      postedAt: job.date || null
    }))
    .filter((job) => job.url);
} // end getReedJobs
