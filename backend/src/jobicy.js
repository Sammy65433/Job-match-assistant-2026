export async function getJobicyJobs(track) {
  const tag = track === "data" ? "sql" : "javascript";
  const url = `https://jobicy.com/api/v2/remote-jobs?count=50&tag=${tag}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Jobicy returned ${response.status}`);
  } // end if not ok

  const data = await response.json();
  const list = Array.isArray(data.jobs) ? data.jobs : [];

  console.log("Jobicy first job:", list[0]); // CHECK 1

  return list.map((job) => ({
    id: `jobicy-${job.id}`,
    title: job.jobTitle || job.title || "",
    company: job.companyName || "",
    location: job.jobGeo || "",
    url: job.url,
    source: "Jobicy"
  })); // end map
} // end getJobicyJobs