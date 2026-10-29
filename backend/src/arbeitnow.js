import { asHttpsUrl, stripHtml } from "./text.js";

const ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api";

function postedAt(value) {
  if (!value) return null;

  const date = new Date(value * 1000);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
} // end postedAt

export async function getArbeitnowJobs({ remoteOnly = true } = {}) {
  const response = await fetch(ARBEITNOW_URL, {
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`Arbeitnow returned ${response.status}`);
  } // end if not ok

  const data = await response.json();
  const list = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : [];

  return list
    .filter((job) => !remoteOnly || job.remote === true)
    .map((job) => ({
      id: `arbeitnow-${job.slug || job.url}`,
      title: job.title || "",
      company: job.company_name || "Company not listed",
      location: job.location || (job.remote ? "Remote" : ""),
      description: stripHtml(job.description),
      url: asHttpsUrl(job.url),
      source: "Arbeitnow",
      postedAt: postedAt(job.created_at)
    }))
    .filter((job) => job.url);
} // end getArbeitnowJobs
