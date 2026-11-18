import { getRemotiveAudioJobs } from "./remotive.js";
import { RELATED_TITLE, searchAdzunaAudioJobs } from "./adzuna.js";
import { getJoobleJobs } from "./jooble.js";
import { detectWorkMode } from "./workMode.js";
import { cachedWithFallback } from "./cache.js";
import { JOOBLE_CACHE_MS, JOOBLE_STALE_MS } from "./config.js";

const AUDIO_HYBRID_LOCATION = {
  los_angeles: "Los Angeles, CA",
  newark: "Newark, NJ"
};

async function discoverAudioViaJoobleHybrid(area) {
  const joobleLocation = AUDIO_HYBRID_LOCATION[area] || "Los Angeles, CA";

  const found = await cachedWithFallback(
    `jooble-audio-${area}-hybrid`,
    JOOBLE_CACHE_MS,
    JOOBLE_STALE_MS,
    () =>
      getJoobleJobs({
        track: "audio",
        location: joobleLocation,
        hybrid: true
      })
  );

  return found
    .map((job) => ({ ...job, workMode: detectWorkMode(job) }))
    .filter((job) => job.workMode === "hybrid")
    .filter((job) =>
      RELATED_TITLE.test(`${job.title || ""} ${job.description || ""}`)
    )
    .slice(0, 30);
} // end discoverAudioViaJoobleHybrid

export async function discoverAudioJobs(area, mode = "in-person") {
  if (mode === "hybrid") {
    try {
      return await discoverAudioViaJoobleHybrid(area);
    } catch (error) {
      console.error("Jooble audio hybrid discovery failed:", error.message);
      return [];
    } // end try/catch
  } // end if hybrid

  const jobs = [...(await searchAdzunaAudioJobs(area, mode))];

  if (mode === "remote") {
    const remotiveAudio = await getRemotiveAudioJobs();
    const knownUrls = new Set(jobs.map((job) => job.url).filter(Boolean));

    for (const job of remotiveAudio) {
      if (!job.url || knownUrls.has(job.url)) continue;
      knownUrls.add(job.url);

      jobs.push({
        ...job,
        workMode: "remote",
        relevance: "review",
        reason: "Remote audio production role from Remotive."
      });
    } // end for remotive audio merge
  } // end if remote

  return jobs;
} // end discoverAudioJobs
