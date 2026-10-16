export async function getHimalayasJobs() {
  const response = await fetch("https://himalayas.app/jobs/api?limit=20");
  if (!response.ok) {
    throw new Error(`Himalayas returned ${response.status}`);
  } // end if not ok

  const data = await response.json();
  const list = Array.isArray(data.jobs) ? data.jobs : [];

  console.log("Himalayas first job:", list[0]); // CHECK 2

  return list.map((job) => ({
    id: `himalayas-${job.guid || job.applicationLink}`,
    title: job.title || "",
    company: job.companyName || "",
    location: Array.isArray(job.locationRestrictions)
      ? job.locationRestrictions.join(", ")
      : "",
    url: job.applicationLink || job.guid,
    source: "Himalayas"
  })); // end map
} // end getHimalayasJobs