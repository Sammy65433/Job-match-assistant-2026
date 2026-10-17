import { cached } from "./cache.js";
import { getMuseJobs } from "./muse.js";
import { getAllBoardJobs } from "./boards.js";
import { COMPANY_BOARDS } from "../data/companyBoards.js";
import { searchAdzunaJobs } from "./adzuna.js";
import { runLoaders, statsKey } from "./loaders.js";
import { titleMatchesTrack, SENIOR_TITLE, ENTRY_TITLE } from "./discover.js";

const HOUR = 60 * 60 * 1000;

const AREAS = {
  los_angeles: {
    museLocations: ["Los Angeles, CA"],
    keywords: [
      "los angeles", "santa monica", "culver city", "burbank",
      "pasadena", "glendale", "long beach", "el segundo", "hollywood"
    ]
  },
  newark: {
    museLocations: ["Newark, NJ", "New York, NY"],
    keywords: [
      "newark", "new york", "nyc", "brooklyn", "manhattan",
      "jersey city", "hoboken", "queens", "bronx"
    ]
  }
}; // end AREAS

const ADZUNA_QUERY = {
  software: "software developer",
  data: "data analyst"
}; // end ADZUNA_QUERY

function inArea(location, area) {
  const text = String(location || "").toLowerCase();
  return AREAS[area].keywords.some((word) => text.includes(word));
} // end inArea

function classifyJob(job, track) {
  const title = typeof job.title === "string" ? job.title.trim() : "";

  if (!title || SENIOR_TITLE.test(title)) return null;
  if (!titleMatchesTrack(title, track)) return null;

  return {
    ...job,
    title,
    levelGroup:
      job.entryLevelListed || ENTRY_TITLE.test(title)
        ? "explicit-entry-level"
        : "level-unspecified"
  };
} // end classifyJob

export async function discoverInPersonJobs(track, area) {
  if ((track !== "software" && track !== "data") || !AREAS[area]) {
    throw new Error("Choose software or data, and a valid area.");
  } // end if invalid

  const loaders = [
    {
      name: "Adzuna",
      run: () => searchAdzunaJobs(ADZUNA_QUERY[track], area)
    },
    {
      name: "The Muse",
      run: () =>
        cached(`muse-${track}-${area}`, 3 * HOUR, () =>
          getMuseJobs({ track, location: AREAS[area].museLocations })
        )
    },
    {
      name: "Company boards",
      run: async () => {
        const { jobs, errors } = await cached("boards-all", 3 * HOUR, () =>
          getAllBoardJobs(COMPANY_BOARDS)
        );

        return {
          jobs: jobs.filter((job) => inArea(job.location, area)),
          errors
        };
      } // end run
    }
  ]; // end loaders

  const { jobs, errors, stats } = await runLoaders(loaders);
  const seen = new Set();

  const filteredJobs = jobs
    .filter(
      (job) =>
        job && typeof job.url === "string" && /^https:\/\//i.test(job.url)
    ) // end filter url
    .map((job) => classifyJob(job, track))
    .filter(Boolean)
    .filter((job) => {
      const key = `${job.title}|${job.company || ""}`.trim().toLowerCase();

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }) // end filter dedupe
    .sort((a, b) => {
      const aEntry = a.levelGroup === "explicit-entry-level" ? 0 : 1;
      const bEntry = b.levelGroup === "explicit-entry-level" ? 0 : 1;
      return aEntry - bEntry;
    }); // end sort

  filteredJobs.forEach((job) => {
    const key = statsKey(job);
    if (stats[key]) stats[key].kept += 1;
  }); // end forEach kept

  return { jobs: filteredJobs, errors, stats };
} // end discoverInPersonJobs