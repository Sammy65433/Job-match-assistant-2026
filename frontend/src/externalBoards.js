import { TRACKS } from "./tracks.js";

// Plain-text locations used by the external boards. The in-app AREAS values are
// internal keys, so they are mapped to real city strings here.
const AREA_LOCATIONS = {
  los_angeles: "Los Angeles, CA",
  newark: "Newark, NJ"
};

// LinkedIn's f_WT filter: 1 = on-site, 2 = remote, 3 = hybrid.
const LINKEDIN_WORKPLACE = {
  remote: "2",
  hybrid: "3",
  "in-person": "1"
};

// ZipRecruiter's refine_by_location_type filter.
const ZIP_WORKPLACE = {
  remote: "remote",
  hybrid: "hybrid",
  "in-person": "on_site"
};

export function defaultExternalKeywords(track) {
  return TRACKS[track]?.label ?? "jobs";
} // end defaultExternalKeywords

export function externalLocation(mode, area) {
  if (mode === "remote") return "Remote";
  return AREA_LOCATIONS[area] ?? AREA_LOCATIONS.newark;
} // end externalLocation

function boardUrl(base, params = {}) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  } // end for
  return url.toString();
} // end boardUrl

/**
 * Build outbound search links using only public, documented browser URL
 * patterns. No scraping, no APIs, and no listing data crosses between the
 * board and this app: each link simply opens the board's own search results.
 */
export function buildExternalBoards({ keywords, location, mode }) {
  const query = String(keywords ?? "").trim() || "jobs";
  const where = String(location ?? "").trim() || "United States";

  return [
    {
      id: "linkedin",
      name: "LinkedIn",
      url: boardUrl("https://www.linkedin.com/jobs/search/", {
        keywords: query,
        location: where,
        f_WT: LINKEDIN_WORKPLACE[mode]
      }),
      note: "Work type is applied as a filter."
    },
    {
      id: "indeed",
      name: "Indeed",
      url: boardUrl("https://www.indeed.com/jobs", {
        q: query,
        l: where
      })
    },
    {
      id: "ziprecruiter",
      name: "ZipRecruiter",
      url: boardUrl("https://www.ziprecruiter.com/jobs-search", {
        search: query,
        location: where,
        refine_by_location_type: ZIP_WORKPLACE[mode]
      })
    },
    {
      id: "glassdoor",
      name: "Glassdoor",
      url: boardUrl("https://www.glassdoor.com/Job/jobs.htm", {
        "sc.keyword": query
      }),
      note: "Set the location in Glassdoor's search bar."
    },
    {
      id: "lensa",
      name: "Lensa",
      url: boardUrl("https://lensa.com/"),
      manual: true,
      note: "Type the keywords and location into Lensa's search boxes."
    },
    {
      id: "dice",
      name: "Dice",
      url: boardUrl("https://www.dice.com/jobs", {
        q: query,
        location: where
      }),
      note: "Technology-focused board."
    },
    {
      id: "monster",
      name: "Monster",
      url: boardUrl("https://www.monster.com/jobs/search", {
        q: query,
        where
      })
    },
    {
      id: "google",
      name: "Google Jobs",
      url: boardUrl("https://www.google.com/search", {
        q: `${query} jobs ${where}`,
        ibp: "htl;jobs"
      }),
      note: "Aggregated results from across the web."
    }
  ];
} // end buildExternalBoards
