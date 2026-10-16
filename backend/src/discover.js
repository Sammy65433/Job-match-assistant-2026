import { cached } from "./cache.js";
import { getRemotiveJobs, selectRemotiveJobs } from "./remotive.js";
import { getJobicyJobs } from "./jobicy.js";
import { getHimalayasJobs } from "./himalayas.js";

const HOUR = 60 * 60 * 1000;

const SOFTWARE_TITLE =
  /\b(software (engineer|developer)|web developer|front[\s-]?end (engineer|developer)|back[\s-]?end (engineer|developer)|full[\s-]?stack (engineer|developer)|react developer|javascript developer|node(?:\.js)? developer)\b/i;

const DATA_TITLE =
  /\b(data analyst|business analyst|business intelligence analyst|bi analyst|reporting analyst|analytics analyst|data analytics analyst|etl analyst)\b/i;

const SENIOR_TITLE =
  /\b(senior|sr\.?|staff|principal|lead|head|director|manager|architect|vp|vice president|chief)\b/i;

const ENTRY_TITLE =
  /\b(junior|jr\.?|entry[\s-]?level|associate|graduate|new grad)\b/i;

/* ---------- Location rules: US and Canada only for now ---------- */

const US_LOCATION =
  /(?:^|[^a-z])(usa|us|united states|north america)(?![a-z])/i;

const CANADA_LOCATION = /\bcanada\b/i;

const GLOBAL_LOCATION = /\b(worldwide|global|anywhere)\b/i;

const OTHER_REGION_LOCATION =
  /\b(hungary|bulgaria|poland|romania|ukraine|serbia|turkey|united kingdom|uk|ireland|europe|emea|germany|france|spain|portugal|italy|netherlands|sweden|norway|denmark|finland|switzerland|austria|apac|asia|india|philippines|singapore|japan|china|australia|new zealand|latam|latin america|south america|brazil|mexico|argentina|colombia|africa|middle east)\b/i;

export function classifyLocation(location) {
  const text = typeof location === "string" ? location.trim() : "";

  // turn "U.S." and "U.S.A." into "usa" so the pattern can see them
  const normalized = text.replace(/u\.s\.a?\.?/gi, "usa");

  if (US_LOCATION.test(normalized)) return "us-mentioned";
  if (CANADA_LOCATION.test(normalized)) return "canada-mentioned";

  // "Worldwide" or a blank location may include the US or Canada,
  // but the full listing still has to be checked.
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

  const matchesRole =
    track === "software"
      ? SOFTWARE_TITLE.test(title)
      : DATA_TITLE.test(title);

  if (!matchesRole) return null;

  const locationGroup = classifyLocation(job.location);

  if (locationGroup === "outside-region") return null;

  return {
    ...job,
    title,
    levelGroup: ENTRY_TITLE.test(title)
      ? "explicit-entry-level"
      : "level-unspecified",
    locationGroup
  };
} // end classifyJob

/* ---------- Sources ---------- */

async function loadRemotive(track) {
  const allJobs = await cached("remotive-all", 6 * HOUR, getRemotiveJobs);
  const selected = selectRemotiveJobs(allJobs, track);

  return selected.map((job) => ({
    ...job,
    id: `remotive-${job.id}`,
    source: "Remotive"
  })); // end map
} // end loadRemotive

export async function discoverRemoteJobs(track) {
  if (track !== "software" && track !== "data") {
    throw new Error("Choose the software or data track.");
  } // end if invalid track

  const loaders = [
    { name: "Remotive", run: () => loadRemotive(track) },
    {
      name: "Jobicy",
      run: () =>
        cached(`jobicy-${track}`, 3 * HOUR, () => getJobicyJobs(track))
    },
    {
      name: "Himalayas",
      run: () => cached("himalayas", 6 * HOUR, getHimalayasJobs)
    }
  ]; // end loaders

  const results = await Promise.allSettled(
    loaders.map((loader) => loader.run())
  );

  const jobs = [];
  const errors = [];
  const stats = {};

  loaders.forEach((loader) => {
    stats[loader.name] = { fetched: 0, kept: 0 };
  }); // end forEach stats setup

  results.forEach((result, index) => {
    const name = loaders[index].name;

    if (result.status === "fulfilled") {
      const list = Array.isArray(result.value) ? result.value : [];
      stats[name].fetched = list.length;
      jobs.push(...list);
    } else {
      errors.push(`${name}: ${result.reason.message}`);
    } // end if fulfilled
  }); // end forEach results

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
    if (stats[job.source]) stats[job.source].kept += 1;
  }); // end forEach kept

  return { jobs: filteredJobs, errors, stats };
} // end discoverRemoteJobs