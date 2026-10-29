import { useEffect, useState } from "react";

import { apiRequest } from "../api.js";

const EMPTY_SET = new Set();

export function useAppliedListings({ enabled, track, token }) {
  const [appliedListingIds, setAppliedListingIds] = useState(EMPTY_SET);
  const active = enabled && Boolean(token);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    async function loadAppliedListings() {
      try {
        const data = await apiRequest(
          `/api/saved-jobs?track=${encodeURIComponent(track)}`,
          {},
          token
        );

        if (!cancelled) {
          setAppliedListingIds(
            new Set(
              (data.savedJobs || [])
                .filter((job) => job.status === "applied" && job.sourceJobId)
                .map((job) => `${job.source}:${job.sourceJobId}`)
            )
          );
        }
      } catch (error) {
        if (!cancelled) {
          setAppliedListingIds(EMPTY_SET);
          console.error("Could not load applied listing markers:", error);
        }
      }
    }

    void loadAppliedListings();

    return () => {
      cancelled = true;
    };
  }, [active, track, token]);

  return active ? appliedListingIds : EMPTY_SET;
}
