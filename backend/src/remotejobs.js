import { asHttpsUrl, stripHtml } from "./text.js";

const REMOTEJOBS_URL = "https://remotejobs.org/api/v1/jobs";
const PAGE_SIZE = 50;
const MAX_PAGES = 2;

function locationText(job) {
  if (typeof job.location === "string" && job.location.trim()) {
    return job.location.trim();
  } // end if location

  const raw = job.location_normalization?.raw;
  if (typeof raw === "string" && raw.trim()) return raw.trim();

  if (job.location_normalization?.work_arrangement === "remote") {
    return "Remote";
  } // end if remote

  return "";
} // end locationText

export async function getRemoteJobsOrgJobs() {
  const jobs = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(REMOTEJOBS_URL);
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(page * PAGE_SIZE));

    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`RemoteJobs.org returned ${response.status}`);
    } // end if not ok

    const data = await response.json();
    const list = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : [];

    jobs.push(...list);

    if (list.length < PAGE_SIZE) break;
  } // end for pages

  return jobs
    .map((job) => ({
      id: `remotejobs-${job.id || job.url}`,
      title: job.title || "",
      company: job.company?.name || job.company_name || "Company not listed",
      location: locationText(job),
      description: stripHtml(job.description),
      url: asHttpsUrl(job.apply_url || job.url),
      source: "RemoteJobs.org",
      postedAt: job.posted_at || null
    }))
    .filter((job) => job.url);
} // end getRemoteJobsOrgJobs
