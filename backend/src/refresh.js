import { invalidateCache } from "./cache.js";
import { discoverRemoteJobs } from "./discover.js";
import { discoverHybridJobs } from "./hybrid.js";
import { searchAdzunaAudioJobs } from "./adzuna.js";
import {
  AREAS,
  AUDIO_MODES,
  CACHE_TTL_HOURS,
  CACHE_TTL_MS,
  DISCOVERY_TRACKS
} from "./config.js";

const state = {
  running: false,
  lastRefreshAt: null,
  lastDurationMs: null,
  lastErrors: [],
  lastCounts: null
};

function refreshTargets() {
  const targets = [];

  for (const track of DISCOVERY_TRACKS) {
    targets.push({
      name: `remote:${track}`,
      run: () => discoverRemoteJobs(track)
    });

    for (const area of AREAS) {
      targets.push({
        name: `hybrid:${track}:${area}`,
        run: () => discoverHybridJobs(track, area)
      });
    } // end for areas
  } // end for tracks

  for (const area of AREAS) {
    for (const mode of AUDIO_MODES) {
      targets.push({
        name: `audio:${area}:${mode}`,
        run: () => searchAdzunaAudioJobs(area, mode)
      });
    } // end for modes
  } // end for areas

  return targets;
} // end refreshTargets

export async function refreshAllDiscovery() {
  if (state.running) return getRefreshStatus();

  state.running = true;
  const startedAt = Date.now();
  const errors = [];
  let succeeded = 0;
  let failed = 0;

  invalidateCache();

  for (const target of refreshTargets()) {
    try {
      await target.run();
      succeeded += 1;
    } catch (error) {
      failed += 1;
      errors.push(`${target.name}: ${error.message}`);
    } // end try/catch
  } // end for targets

  state.running = false;
  state.lastRefreshAt = new Date().toISOString();
  state.lastDurationMs = Date.now() - startedAt;
  state.lastErrors = errors;
  state.lastCounts = { succeeded, failed };

  if (errors.length > 0) {
    console.error(
      `Discovery refresh finished with ${failed} failed source group(s):`,
      errors.join(" | ")
    );
  } // end if errors

  return getRefreshStatus();
} // end refreshAllDiscovery

export function getRefreshStatus() {
  const lastRefreshTime = state.lastRefreshAt
    ? Date.parse(state.lastRefreshAt)
    : null;

  return {
    running: state.running,
    lastRefreshAt: state.lastRefreshAt,
    nextRefreshAt: lastRefreshTime
      ? new Date(lastRefreshTime + CACHE_TTL_MS).toISOString()
      : null,
    ttlHours: CACHE_TTL_HOURS,
    lastDurationMs: state.lastDurationMs,
    lastErrors: state.lastErrors,
    lastCounts: state.lastCounts
  };
} // end getRefreshStatus
