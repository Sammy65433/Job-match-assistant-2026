import { CACHE_TTL_MS } from "./config.js";
import { refreshAllDiscovery } from "./refresh.js";

const START_DELAY_MS = 5 * 1000;

export function startDiscoveryRefresh() {
  if (process.env.DISABLE_JOB_REFRESH === "1") {
    return () => {};
  } // end if disabled

  function run() {
    refreshAllDiscovery().catch((error) => {
      console.error("Scheduled discovery refresh failed:", error);
    });
  } // end run

  const startupTimer = setTimeout(run, START_DELAY_MS);
  const intervalTimer = setInterval(run, CACHE_TTL_MS);

  if (typeof startupTimer.unref === "function") startupTimer.unref();
  if (typeof intervalTimer.unref === "function") intervalTimer.unref();

  return () => {
    clearTimeout(startupTimer);
    clearInterval(intervalTimer);
  }; // end stop
} // end startDiscoveryRefresh
