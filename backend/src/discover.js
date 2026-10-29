import { cached } from "./cache.js";
import { getRemotiveJobs, selectRemotiveJobs } from "./remotive.js";
import { getJobicyJobs } from "./jobicy.js";
import { getHimalayasJobs } from "./himalayas.js";
import { getMuseJobs } from "./muse.js";
import { getAllBoardJobs } from "./boards.js";
import { COMPANY_BOARDS } from "../data/companyBoards.js";
import { runLoaders, statsKey } from "./loaders.js";
import { getJoobleJobs } from "./jooble.js";
import { getArbeitnowJobs } from "./arbeitnow.js";
import { getRemoShiftJobs } from "./remoshift.js";
import { getRemoteJobsOrgJobs } from "./remotejobs.js";
import { getUsaJobs } from "./usajobs.js";
import { getReedJobs } from "./reed.js";
import { getFindworkJobs } from "./findwork.js";
import { CACHE_TTL_MS } from "./config.js";

const SOFTWARE_TITLE =
  /\b(software (engineer|developer)|web developer|front[\s-]?end (engineer|developer)|back[\s-]?end (engineer|developer)|full[\s-]?stack (engineer|developer)|react developer|javascript developer|node(?:\.js)? developer)\b/i;

const DATA_TITLE =
  /\b(data analyst|business analyst|business intelligence analyst|bi analyst|reporting analyst|analytics analyst|data analytics analyst|etl analyst)\b/i;

export const SENIOR_TITLE =
  /\b(senior|sr\.?|staff|principal|lead|head|director|manager|architect|vp|vice president|chief)\b/i;

export const ENTRY_TITLE =
  /\b(junior|jr\.?|entry[\s-]?level|associate|graduate|new grad)\b/i;

export function titleMatchesTrack(title, track) {
  if (track === "software") return SOFTWARE_TITLE.test(title);
  if (track === "data") return DATA_TITLE.test(title);
  return false;
} // end titleMatchesTrack

/* ---------- Location rules: US and Canada only for now ---------- */

const US_LOCATION =
  /(?:^|[^a-z])(usa|us|united states|north america)(?![a-z])/i;

const CANADA_LOCATION = /\bcanada\b/i;

const GLOBAL_LOCATION = /\b(worldwide|global|anywhere)\b/i;

const OTHER_REGION_WORDS = [
  "hungary", "bulgaria", "poland", "romania", "ukraine", "serbia", "turkey",
  "united kingdom", "uk", "ireland", "europe", "emea", "germany", "france",
  "spain", "portugal", "italy", "netherlands", "sweden", "norway", "denmark",
  "finland", "switzerland", "austria", "apac", "asia", "india", "philippines",
  "singapore", "japan", "china", "australia", "new zealand", "latam",
  "latin america", "south america", "brazil", "mexico", "argentina",
  "colombia", "africa", "middle east",
  "berlin", "munich", "hamburg", "cologne", "frankfurt", "stuttgart",
  "vienna", "zurich", "amsterdam", "paris", "madrid", "barcelona", "lisbon",
  "dublin", "london", "manchester", "birmingham", "edinburgh", "glasgow",
  "warsaw", "krakow", "prague", "budapest", "bucharest", "sofia", "athens",
  "stockholm", "copenhagen", "oslo", "helsinki", "brussels", "milan", "rome"
];

const OTHER_REGION_LOCATION = new RegExp(
  `\\b(${OTHER_REGION_WORDS.join("|")})\\b`,
  "i"
);

export function classifyLocation(location) {
  const text = typeof location === "string" ? location.trim() : "";
  const normalized = text.replace(/u\.s\.a?\.?/gi, "usa");

  if (US_LOCATION.test(normalized)) return "us-mentioned";
  if (CANADA_LOCATION.test(normalized)) return "canada-mentioned";
  if (GLOBAL_LOCATION.test(normalized)) return "verify-location";
  if (OTHER_REGION_LOCATION.test(normalized)) return "outside-region";

  return "verify-location";
} // end classifyLocation

const LOCATION_ORDER = {
  "us-mentioned": 0,
  "canada-mentioned": 1,
  "verify-location": 2
};

/* ---------- Job rules ---------- */

function classifyJob(job, track) {
  const title = typeof job.title === "string" ? job.title.trim() : "";

  if (!title || SENIOR_TITLE.test(title)) return null;
  if (!titleMatchesTrack(title, track)) return null;

  const locationGroup = classifyLocation(job.location);

  if (locationGroup === "outside-region") return null;

  return {
    ...job,
    title,
    levelGroup:
      job.entryLevelListed || ENTRY_TITLE.test(title)
        ? "explicit-entry-level"
        : "level-unspecified",
    locationGroup
  };
} // end classifyJob

/* ---------- Sources ---------- */

async function loadRemotive(track) {
  const allJobs = await cached("remotive-all", CACHE_TTL_MS, getRemotiveJobs);
  const selected = selectRemotiveJobs(allJobs, track);

  return selected.map((job) => ({
    ...job,
    id: `remotive-${job.id}`,
    source: "Remotive"
  })); // end map
} // end loadRemotive

async function loadRemoteBoards() {
  const { jobs, errors } = await cached("boards-all", CACHE_TTL_MS, () =>
    getAllBoardJobs(COMPANY_BOARDS)
  );

  return {
    jobs: jobs.filter((job) => /remote/i.test(job.location)),
    errors
  };
} // end loadRemoteBoards

export async function discoverRemoteJobs(track) {
  if (track !== "software" && track !== "data") {
    throw new Error("Choose the software or data track.");
  } // end if invalid track

  const loaders = [
    { name: "Remotive", run: () => loadRemotive(track) },
    {
      name: "Jobicy",
      run: () =>
        cached(`jobicy-${track}`, CACHE_TTL_MS, () => getJobicyJobs(track))
    },
    {
      name: "Himalayas",
      run: () => cached("himalayas", CACHE_TTL_MS, getHimalayasJobs)
    },
    {
      name: "The Muse",
      run: () =>
        cached(`muse-${track}-remote`, CACHE_TTL_MS, () =>
          getMuseJobs({ track, location: "Flexible / Remote" })
        )
        
    },
        {
      name: "Jooble",
      run: () =>
        cached(`jooble-${track}-remote`, CACHE_TTL_MS, async () => {
          const list = await getJoobleJobs({
            track,
            location: "United States",
            remote: true
          });

          return list.filter((job) =>
            /remote/i.test(`${job.location} ${job.title} ${job.description}`)
          );
        })
    },
    {
      name: "Arbeitnow",
      run: () =>
        cached("arbeitnow-remote", CACHE_TTL_MS, () =>
          getArbeitnowJobs({ remoteOnly: true })
        )
    },
    {
      name: "RemoShift",
      run: () =>
        cached(`remoshift-${track}`, CACHE_TTL_MS, () =>
          getRemoShiftJobs(track)
        )
    },
    {
      name: "RemoteJobs.org",
      run: () =>
        cached("remotejobs-all", CACHE_TTL_MS, getRemoteJobsOrgJobs)
    },
    { name: "Company boards", run: () => loadRemoteBoards() }
  ]; // end loaders

  if (process.env.USAJOBS_API_KEY && process.env.USAJOBS_EMAIL) {
    loaders.push({
      name: "USAJOBS",
      run: () =>
        cached(`usajobs-${track}`, CACHE_TTL_MS, () => getUsaJobs({ track }))
    });
  } // end if USAJOBS configured

  if (process.env.REED_API_KEY) {
    loaders.push({
      name: "Reed",
      run: () =>
        cached(`reed-${track}`, CACHE_TTL_MS, () => getReedJobs({ track }))
    });
  } // end if Reed configured

  if (process.env.FINDWORK_API_KEY) {
    loaders.push({
      name: "Findwork",
      run: () =>
        cached(`findwork-${track}`, CACHE_TTL_MS, () =>
          getFindworkJobs({ track })
        )
    });
  } // end if Findwork configured

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

      if (aEntry !== bEntry) return aEntry - bEntry;

      return LOCATION_ORDER[a.locationGroup] - LOCATION_ORDER[b.locationGroup];
    }); // end sort

  filteredJobs.forEach((job) => {
    const key = statsKey(job);
    if (stats[key]) stats[key].kept += 1;
  }); // end forEach kept

  return { jobs: filteredJobs, errors, stats };
} // end discoverRemoteJobs