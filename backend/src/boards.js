import { stripHtml } from "./text.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });

  if (!response.ok) {
    throw new Error(`returned ${response.status}`);
  } // end if not ok

  return response.json();
} // end getJson

function joinLocation(parts) {
  return parts.filter(Boolean).join(", ");
} // end joinLocation

function remoteLocation(location, isRemote) {
  if (!isRemote) return location;
  if (/remote/i.test(location)) return location;
  return location ? `Remote - ${location}` : "Remote";
} // end remoteLocation

function greenhouseJobs(board) {
  return getJson(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.token)}/jobs`
  ).then((data) => {
    const list = Array.isArray(data.jobs) ? data.jobs : [];

    return list.map((job) => ({
      id: `greenhouse-${board.token}-${job.id}`,
      title: job.title || "",
      company: board.name,
      location: job.location?.name || "",
      url: job.absolute_url,
      description: "",
      source: "Greenhouse"
    }));
  });
} // end greenhouseJobs

function leverJobs(board) {
  return getJson(
    `https://api.lever.co/v0/postings/${encodeURIComponent(board.token)}?mode=json`
  ).then((data) => {
    const list = Array.isArray(data) ? data : [];

    return list.map((job) => ({
      id: `lever-${board.token}-${job.id}`,
      title: job.text || "",
      company: board.name,
      location: job.categories?.location || "",
      url: job.hostedUrl,
      description:
        typeof job.descriptionPlain === "string"
          ? job.descriptionPlain.slice(0, 8000)
          : "",
      source: "Lever"
    }));
  });
} // end leverJobs

function ashbyJobs(board) {
  return getJson(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board.token)}?includeCompensation=true`
  ).then((data) => {
    const list = Array.isArray(data?.jobs) ? data.jobs : [];

    return list
      .filter((job) => job.isListed !== false)
      .map((job) => {
        const secondary = Array.isArray(job.secondaryLocations)
          ? job.secondaryLocations.map((item) => item?.location).filter(Boolean)
          : [];
        const location = joinLocation([
          job.location,
          ...secondary.filter(
            (name) => !String(job.location || "").includes(name)
          )
        ]);

        return {
          id: `ashby-${board.token}-${job.id}`,
          title: job.title || "",
          company: board.name,
          location: remoteLocation(location, job.isRemote === true),
          url: job.jobUrl || job.applyUrl,
          description: stripHtml(job.descriptionPlain || job.descriptionHtml, 8000),
          source: "Ashby"
        };
      });
  });
} // end ashbyJobs

function smartRecruitersJobs(board) {
  return getJson(
    `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(board.token)}/postings?limit=100`
  ).then((data) => {
    const list = Array.isArray(data?.content) ? data.content : [];

    return list.map((job) => {
      const location = job.location || {};
      const text = joinLocation([
        location.city,
        location.region,
        location.country
      ]);
      const isRemote = location.remote === true;

      return {
        id: `smartrecruiters-${board.token}-${job.id || job.uuid}`,
        title: job.name || "",
        company: board.name,
        location: remoteLocation(text, isRemote),
        url:
          job.ref ||
          `https://jobs.smartrecruiters.com/${encodeURIComponent(board.token)}/${encodeURIComponent(job.id)}`,
        description: "",
        source: "SmartRecruiters"
      };
    });
  });
} // end smartRecruitersJobs

function workableJobs(board) {
  return getJson(
    `https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(board.token)}?details=true`
  ).then((data) => {
    const list = Array.isArray(data?.jobs) ? data.jobs : [];

    return list.map((job) => {
      const location = job.location || {};
      const text =
        location.location_str ||
        joinLocation([location.city, location.region, location.country]);

      return {
        id: `workable-${board.token}-${job.shortcode || job.id}`,
        title: job.title || "",
        company: board.name,
        location: remoteLocation(text, job.remote === true),
        url: job.url || job.shortlink,
        description: stripHtml(job.description, 8000),
        source: "Workable"
      };
    });
  });
} // end workableJobs

const HANDLERS = {
  greenhouse: greenhouseJobs,
  lever: leverJobs,
  ashby: ashbyJobs,
  smartrecruiters: smartRecruitersJobs,
  workable: workableJobs
};

async function getOneBoard(board) {
  const handler = HANDLERS[board.ats];

  if (!handler) {
    throw new Error(`unknown ATS "${board.ats}"`);
  } // end if unknown

  return handler(board);
} // end getOneBoard

export async function getAllBoardJobs(boards) {
  const jobs = [];
  const errors = [];

  for (const board of boards) {
    try {
      jobs.push(...(await getOneBoard(board)));
    } catch (error) {
      errors.push(`${board.name} (${board.ats}): ${error.message}`);
    } // end try/catch

    if (board.ats === "lever" || board.ats === "workable") {
      await sleep(1000);
    } // end if rate-limited
  } // end for boards

  if (jobs.length === 0 && errors.length > 0) {
    throw new Error(errors.join("; "));
  } // end if every board failed

  return { jobs, errors };
} // end getAllBoardJobs
