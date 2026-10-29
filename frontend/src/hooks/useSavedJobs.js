import { useEffect, useState } from "react";

import { apiRequest } from "../api.js";

const EMPTY_JOBS = [];

export function useSavedJobs({ enabled, track, token, onSessionExpired }) {
  const [savedJobs, setSavedJobs] = useState(EMPTY_JOBS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const active = enabled && Boolean(token);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    async function loadSavedJobs() {
      setLoading(true);
      setError("");

      try {
        const data = await apiRequest(
          `/api/saved-jobs?track=${encodeURIComponent(track)}`,
          {},
          token
        );

        if (!cancelled) {
          setSavedJobs(Array.isArray(data.savedJobs) ? data.savedJobs : EMPTY_JOBS);
        }
      } catch (requestError) {
        if (requestError.status === 401) {
          onSessionExpired();
        } else if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSavedJobs();

    return () => {
      cancelled = true;
    };
  }, [active, track, token, onSessionExpired]);

  return {
    savedJobs: active ? savedJobs : EMPTY_JOBS,
    setSavedJobs,
    loading: active ? loading : false,
    error: active ? error : "",
    setError
  };
}
