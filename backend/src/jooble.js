const JOOBLE_URL = "https://jooble.org/api";

const KEYWORDS = {
  software: "software developer",
  data: "data analyst"
}; // end KEYWORDS

function stripHtml(value) {
  return typeof value === "string"
    ? value
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000)
    : "";
} // end stripHtml

export async function getJoobleJobs({ track, location, remote = false, hybrid = false }) {
  const apiKey = process.env.JOOBLE_API_KEY;

  if (!apiKey) {
    throw new Error("Jooble API key is not configured.");
  } // end if no key

  const base = KEYWORDS[track];

  if (!base) return [];

  const response = await fetch(`${JOOBLE_URL}/${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keywords: remote ? `remote ${base}` : hybrid ? `hybrid ${base}` : base,
      location,
      radius: "40",
      page: "1"
    }),
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`Jooble returned ${response.status}`);
  } // end if not ok

  const data = await response.json();

  if (!Array.isArray(data.jobs)) {
    throw new Error("Unexpected Jooble response.");
  } // end if unexpected

  return data.jobs
    .filter((job) => typeof job.link === "string" && /^https:\/\//i.test(job.link))
    .map((job) => ({
      id: `jooble-${job.id || job.link}`,
      title: stripHtml(job.title),
      company: stripHtml(job.company) || "Company not listed",
      location: stripHtml(job.location),
      description: stripHtml(job.snippet),
      url: job.link,
      source: "Jooble"
    })); // end map
} // end getJoobleJobs