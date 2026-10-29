const COMPANY_BOARD_SOURCES = new Set([
  "Greenhouse",
  "Lever",
  "Ashby",
  "SmartRecruiters",
  "Workable"
]);

export function statsKey(job) {
  return COMPANY_BOARD_SOURCES.has(job.source) ? "Company boards" : job.source;
} // end statsKey

export async function runLoaders(loaders) {
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

    if (result.status === "rejected") {
      errors.push(`${name}: ${result.reason.message}`);
      return;
    } // end if rejected

    const value = result.value;
    const list = Array.isArray(value) ? value : value?.jobs;
    const safeList = Array.isArray(list) ? list : [];

    if (!Array.isArray(value) && Array.isArray(value?.errors)) {
      value.errors.forEach((message) => errors.push(`${name}: ${message}`));
    } // end if partial errors

    stats[name].fetched = safeList.length;
    jobs.push(...safeList);
  }); // end forEach results

  return { jobs, errors, stats };
} // end runLoaders
