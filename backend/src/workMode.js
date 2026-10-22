const REMOTE_ONLY_SOURCES = new Set(["Remotive", "Jobicy", "Himalayas"]);

export function detectWorkMode(job) {
  if (REMOTE_ONLY_SOURCES.has(job.source)) return "remote";

  const text = `${job.title || ""} ${job.location || ""} ${job.description || ""}`;

  if (/\bhybrid\b/i.test(text)) return "hybrid";
  if (/\b(remote|work from home|wfh)\b/i.test(text)) return "remote";

  return "in-person";
} // end detectWorkMode