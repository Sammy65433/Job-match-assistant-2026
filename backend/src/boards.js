const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

  if (!response.ok) {
    throw new Error(`returned ${response.status}`);
  } // end if not ok

  return response.json();
} // end getJson

async function getOneBoard(board) {
  if (board.ats === "greenhouse") {
    const data = await getJson(
      `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.token)}/jobs`
    );
    const list = Array.isArray(data.jobs) ? data.jobs : [];

    return list.map((job) => ({
      id: `greenhouse-${board.token}-${job.id}`,
      title: job.title || "",
      company: board.name,
      location: job.location?.name || "",
      url: job.absolute_url,
      description: "",
      source: "Greenhouse"
    })); // end map
  } // end if greenhouse

  if (board.ats === "lever") {
    const data = await getJson(
      `https://api.lever.co/v0/postings/${encodeURIComponent(board.token)}?mode=json`
    );
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
    })); // end map
  } // end if lever

  throw new Error(`unknown ATS "${board.ats}"`);
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

    if (board.ats === "lever") await sleep(1000);
  } // end for boards

  if (jobs.length === 0 && errors.length > 0) {
    throw new Error(errors.join("; "));
  } // end if every board failed

  return { jobs, errors };
} // end getAllBoardJobs