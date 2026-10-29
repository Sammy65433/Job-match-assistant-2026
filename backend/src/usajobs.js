import { asHttpsUrl, stripHtml } from "./text.js";

const USAJOBS_URL = "https://data.usajobs.gov/api/search";

const KEYWORDS = {
  software: "software engineer",
  data: "data analyst"
};

function locationText(locations) {
  if (!Array.isArray(locations)) return "";

  return locations
    .map((item) => item?.LocationName)
    .filter(Boolean)
    .join(", ");
} // end locationText

export async function getUsaJobs({ track, remote = true }) {
  const apiKey = process.env.USAJOBS_API_KEY;
  const email = process.env.USAJOBS_EMAIL;

  if (!apiKey || !email) {
    throw new Error("USAJOBS_API_KEY and USAJOBS_EMAIL are not configured.");
  } // end if missing

  const keyword = KEYWORDS[track];
  if (!keyword) return [];

  const url = new URL(USAJOBS_URL);
  url.searchParams.set("Keyword", keyword);
  url.searchParams.set("ResultsPerPage", "50");
  if (remote) url.searchParams.set("RemoteIndicator", "true");

  const response = await fetch(url, {
    headers: {
      "User-Agent": email,
      "Authorization-Key": apiKey
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`USAJOBS returned ${response.status}`);
  } // end if not ok

  const data = await response.json();
  const items = data?.SearchResult?.SearchResultItems;

  if (!Array.isArray(items)) {
    throw new Error("Unexpected USAJOBS response.");
  } // end if unexpected

  return items
    .map((item) => {
      const job = item?.MatchedObjectDescriptor || {};
      const applyUrls = Array.isArray(job.ApplyURI) ? job.ApplyURI : [];

      return {
        id: `usajobs-${job.PositionID || job.PositionURI}`,
        title: job.PositionTitle || "",
        company:
          job.OrganizationName || job.DepartmentName || "U.S. Government",
        location: locationText(job.PositionLocation),
        description: stripHtml(
          job.UserArea?.Details?.JobSummary || job.QualificationSummary
        ),
        url: asHttpsUrl(applyUrls[0] || job.PositionURI),
        source: "USAJOBS",
        postedAt: job.PublicationStartDate || null
      };
    })
    .filter((job) => job.url);
} // end getUsaJobs
