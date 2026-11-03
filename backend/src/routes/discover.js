import { Router } from "express";

import { discoverAudioJobs } from "../audio.js";
import { AREAS, AUDIO_MODES, DISCOVERY_TRACKS } from "../config.js";
import { discoverRemoteJobs } from "../discover.js";
import { discoverHybridJobs } from "../hybrid.js";
import { withScores } from "../listingScore.js";
import { getRefreshStatus } from "../refresh.js";
import { parseSkillsQuery } from "../validation.js";

const router = Router();

function refreshedAt() {
  return getRefreshStatus().lastRefreshAt;
} // end refreshedAt

function refreshTtlHours() {
  return getRefreshStatus().ttlHours;
} // end refreshTtlHours

router.get("/status", (_req, res) => {
  res.json(getRefreshStatus());
});

router.get("/remote", async (req, res) => {
  if (!DISCOVERY_TRACKS.includes(req.query.track)) {
    return res
      .status(400)
      .json({ error: "Choose the software or data track." });
  }

  try {
    const { jobs: found, errors, stats } = await discoverRemoteJobs(
      req.query.track
    );

    return res.json({
      track: req.query.track,
      jobs: withScores(
        found,
        req.query.track,
        parseSkillsQuery(req.query.skills)
      ),
      errors,
      stats,
      updatedAt: refreshedAt(),
      ttlHours: refreshTtlHours()
    });
  } catch (error) {
    console.error("Could not discover remote jobs:", error);
    return res.status(502).json({ error: "Could not fetch job listings." });
  }
});

router.get("/hybrid", async (req, res) => {
  const { track, area } = req.query;

  if (!DISCOVERY_TRACKS.includes(track)) {
    return res
      .status(400)
      .json({ error: "Choose the software or data track." });
  }

  if (!AREAS.includes(area)) {
    return res.status(400).json({ error: "Choose los_angeles or newark." });
  }

  try {
    const { jobs: found, errors, stats } = await discoverHybridJobs(track, area);

    return res.json({
      track,
      area,
      jobs: withScores(found, track, parseSkillsQuery(req.query.skills)),
      errors,
      stats,
      updatedAt: refreshedAt(),
      ttlHours: refreshTtlHours()
    });
  } catch (error) {
    console.error("Could not discover hybrid jobs:", error.message);
    return res.status(502).json({ error: "Could not fetch job listings." });
  }
});

router.get("/audio", async (req, res) => {
  const { area, mode = "in-person" } = req.query;

  if (!AREAS.includes(area)) {
    return res.status(400).json({ error: "Choose los_angeles or newark." });
  }

  if (!AUDIO_MODES.includes(mode)) {
    return res
      .status(400)
      .json({ error: "Choose in-person, hybrid, or remote." });
  }

  try {
    const jobs = await discoverAudioJobs(area, mode);

    if (jobs.length === 0) {
      throw new Error("No audio jobs found.");
    }

    return res.json({
      source:
        mode === "hybrid"
          ? "Jooble"
          : mode === "remote"
            ? "Adzuna + Remotive"
            : "Adzuna",
      area,
      mode,
      attribution: "Open each listing using its source site link.",
      jobs: withScores(jobs, "audio", parseSkillsQuery(req.query.skills)),
      updatedAt: refreshedAt(),
      ttlHours: refreshTtlHours()
    });
  } catch (error) {
    console.error("Audio discovery failed:", error.message);
    return res.status(502).json({ error: "Could not fetch audio jobs." });
  }
});

export default router;
