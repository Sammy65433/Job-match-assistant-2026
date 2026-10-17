
const MUSE_URL = "https://www.themuse.com/api/public/jobs";
const MAX_PAGES = 3;

// Category names must match The Muse exactly. Confirm them in their API docs.
const CATEGORIES = {
  software: ["Software Engineering"],
  data: ["Data and Analytics", "Data Science"]
}; // end CATEGORIES

const LEVELS = ["Entry Level"];

function names(list) {
  return Array.isArray(list)
    ? list.map((item) => item?.name).filter(Boolean)
    : [];
} // end names

export async function getMuseJobs({ track, location }) {
  const categories = CATEGORIES[track];

  if (!categories) return [];

  const found = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(MUSE_URL);
    url.searchParams.set("page", String(page));
    categories.forEach((name) => url.searchParams.append("category", name));
    LEVELS.forEach((name) => url.searchParams.append("level", name));
    [].concat(location).forEach((name) =>
      url.searchParams.append("location", name)
    );

    if (process.env.MUSE_API_KEY) {
      url.searchParams.set("api_key", process.env.MUSE_API_KEY);
    } // end if key

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) {
      throw new Error(`The Muse returned ${response.status}`);
    } // end if not ok

    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];
    found.push(...results);

    if (results.length === 0 || page + 1 >= (data.page_count ?? 0)) break;
  } // end for pages

  return found.map((job) => ({
    id: `muse-${job.id}`,
    title: job.name || "",
    company: job.company?.name || "",
    location: names(job.locations).join(", "),
    url: job.refs?.landing_page,
    description:
      typeof job.contents === "string" ? job.contents.slice(0, 8000) : "",
    entryLevelListed: names(job.levels).includes("Entry Level"),
    source: "The Muse"
  })); // end map
} // end getMuseJobs