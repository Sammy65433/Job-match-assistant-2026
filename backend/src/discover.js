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

function classifyJob(job, track) {
  const title = typeof job.title === "string" ? job.title.trim() : "";

  if (!title || SENIOR_TITLE.test(title)) return null;

  const matchesRole =
    track === "software"
      ? SOFTWARE_TITLE.test(title)
      : DATA_TITLE.test(title);

  if (!matchesRole) return null;

  return {
    ...job,
    title,
    levelGroup: ENTRY_TITLE.test(title)
      ? "explicit-entry-level"
      : "level-unspecified"
  };
}

async function loadRemotive(track) {
  const allJobs = await getRemotiveJobs();

  return selectRemotiveJobs(allJobs, track).map((job) => ({
    ...job,
    id: `remotive-${job.id}`,
    source: "Remotive"
  }));
}

export async function discoverRemoteJobs(track) {
  if (track !== "software" && track !== "data") {
    throw new Error("Choose the software or data track.");
  }

  const loaders = [
    { name: "Remotive", run: () => loadRemotive(track) },
    {
      name: "Jobicy",
      run: () =>
        cached(`jobicy-${track}`, 3 * HOUR, () =>
          getJobicyJobs(track)
        )
    },
    {
      name: "Himalayas",
      run: () =>
        cached("himalayas", 6 * HOUR, getHimalayasJobs)
    }
  ];

  const results = await Promise.allSettled(
    loaders.map((loader) => loader.run())
  );

  const jobs = [];
  const errors = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      jobs.push(...result.value);
    } else {
      errors.push(
        `${loaders[index].name}: ${result.reason.message}`
      );
    }
  });

  const seen = new Set();

  const filteredJobs = jobs
    .filter(
      (job) =>
        job &&
        typeof job.url === "string" &&
        /^https:\/\//i.test(job.url)
    )
    .map((job) => classifyJob(job, track))
    .filter(Boolean)
    .filter((job) => {
      const key = `${job.title}|${job.company || ""}`
        .trim()
        .toLowerCase();

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const aIsEntry = a.levelGroup === "explicit-entry-level";
      const bIsEntry = b.levelGroup === "explicit-entry-level";
      return Number(bIsEntry) - Number(aIsEntry);
    });

  return { jobs: filteredJobs, errors };
}
