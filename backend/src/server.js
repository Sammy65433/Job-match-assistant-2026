import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import { jobs } from "../data/jobs.js";
import { matchJob } from "./match.js";
import SavedJob from "./models/SavedJob.js";
import { discoverRemoteJobs } from "./discover.js";
import { searchAdzunaAudioJobs } from "./adzuna.js";
import { compareResume } from "./resumeCompare.js";
import { keywordOverlap } from "./keywordOverlap.js";

const app = express();
const port = Number(process.env.PORT) || 5003;

app.use(cors());
app.use(express.json({ limit: "100kb" }));

const TRACKS = ["software", "data", "audio"];
const STATUSES = ["saved", "ready", "applied", "interview", "rejected"];
const LISTING_SOURCES = ["Remotive", "Jobicy", "Himalayas", "Adzuna"];

function validSkills(skills) {
  return (
    Array.isArray(skills) &&
    skills.length > 0 &&
    skills.length <= 100 &&
    skills.every(
      (skill) =>
        typeof skill === "string" &&
        skill.trim().length > 0 &&
        skill.length <= 100
    )
  );
}

function validTrack(track) {
  return TRACKS.includes(track);
}

function validListingUrl(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 2000
  ) {
    return false;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function cleanSkills(skills) {
  return skills.map((skill) => skill.trim());
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/jobs", (_req, res) => {
  res.json(jobs);
});

app.post("/api/matches", (req, res) => {
  const { skills } = req.body ?? {};

  if (!validSkills(skills)) {
    return res.status(400).json({
      error: "Provide skills as a nonempty array of skill names."
    });
  }

  const matches = jobs
    .map((job) => matchJob(job, { skills }))
    .sort((a, b) => b.score - a.score);

  res.json({
    matches,
    reviewQueue: matches.filter((job) => job.inReviewQueue)
  });
});

app.post("/api/matches/custom", (req, res) => {
  const {
    skills,
    title,
    company,
    description,
    requiredSkills
  } = req.body ?? {};

  if (
    !validSkills(skills) ||
    typeof title !== "string" ||
    !title.trim() ||
    title.length > 150 ||
    typeof company !== "string" ||
    !company.trim() ||
    company.length > 150 ||
    typeof description !== "string" ||
    !description.trim() ||
    description.length > 10000 ||
    !validSkills(requiredSkills)
  ) {
    return res.status(400).json({
      error:
        "Provide skills, title, company, description, and requiredSkills."
    });
  }

  const job = {
    id: "custom-preview",
    title: title.trim(),
    company: company.trim(),
    description: description.trim(),
    requiredSkills: cleanSkills(requiredSkills),
    location: "Not specified",
    remote: false,
    salaryMin: null
  };

  res.json({ match: matchJob(job, { skills }) });
});

app.post("/api/saved-jobs/from-listing", async (req, res) => {
  const {
    track,
    title,
    company,
    description,
    source,
    sourceJobId,
    url
  } = req.body ?? {};

  if (
    !validTrack(track) ||
    typeof title !== "string" ||
    !title.trim() ||
    title.length > 150 ||
    typeof company !== "string" ||
    !company.trim() ||
    company.length > 150 ||
    typeof description !== "string" ||
    description.length > 10000 ||
    !LISTING_SOURCES.includes(source) ||
    typeof sourceJobId !== "string" ||
    !sourceJobId.trim() ||
    sourceJobId.length > 200 ||
    !validListingUrl(url)
  ) {
    return res.status(400).json({ error: "Invalid listing." });
  }

  try {
    const savedJob = await SavedJob.findOneAndUpdate(
      { source, sourceJobId: sourceJobId.trim() },
      {
        $setOnInsert: {
          track,
          title: title.trim(),
          company: company.trim(),
          description: description.trim(),
          requiredSkills: [],
          source,
          sourceJobId: sourceJobId.trim(),
          url,
          status: "saved"
        }
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true
      }
    ).lean();

    res.status(201).json({ savedJob });
  } catch (error) {
    console.error("Could not save listing:", error);
    res.status(500).json({ error: "Could not save listing." });
  }
});

app.get("/api/saved-jobs", async (req, res) => {
  const { track } = req.query;

  if (!validTrack(track)) {
    return res.status(400).json({ error: "Invalid career track." });
  }

  try {
    const savedJobs = await SavedJob.find({ track })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ savedJobs });
  } catch (error) {
    console.error("Could not load saved jobs:", error);
    res.status(500).json({ error: "Could not load saved jobs." });
  }
});

app.post("/api/saved-jobs", async (req, res) => {
  const {
    track,
    title,
    company,
    description,
    requiredSkills
  } = req.body ?? {};

  if (
    !validTrack(track) ||
    typeof title !== "string" ||
    !title.trim() ||
    title.length > 150 ||
    typeof company !== "string" ||
    !company.trim() ||
    company.length > 150 ||
    typeof description !== "string" ||
    !description.trim() ||
    description.length > 10000 ||
    !validSkills(requiredSkills)
  ) {
    return res.status(400).json({
      error:
        "Provide a track, title, company, description, and required skills."
    });
  }

  try {
    const savedJob = await SavedJob.create({
      track,
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      requiredSkills: cleanSkills(requiredSkills)
    });

    res.status(201).json({ savedJob });
  } catch (error) {
    console.error("Could not save job:", error);
    res.status(500).json({ error: "Could not save job." });
  }
});

app.patch("/api/saved-jobs/:id/status", async (req, res) => {
  const { status } = req.body ?? {};

  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid job id." });
  }

  try {
    const currentJob = await SavedJob.findById(req.params.id);

    if (!currentJob) {
      return res.status(404).json({
        error: "Saved job not found."
      });
    }

    const update = { status };

    if (status === "applied" && !currentJob.appliedAt) {
      update.appliedAt = new Date();
    } else if (status === "saved" || status === "ready") {
      update.appliedAt = null;
    }

    const savedJob = await SavedJob.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      {
        returnDocument: "after",
        runValidators: true
      }
    ).lean();

    res.json({ savedJob });
  } catch (error) {
    console.error("Could not update saved job:", error);
    res.status(500).json({
      error: "Could not update saved job."
    });
  }
});

app.get("/api/discover/remote", async (req, res) => {
  const { track } = req.query;

  if (track !== "software" && track !== "data") {
    return res.status(400).json({
      error: "Choose the software or data track."
    });
  }

  try {
    const { jobs: found, errors, stats } =
      await discoverRemoteJobs(track);

    res.json({ track, jobs: found, errors, stats });
  } catch (error) {
    console.error("Could not discover remote jobs:", error);
    res.status(502).json({
      error: "Could not fetch job listings."
    });
  }
});

app.get("/api/discover/audio", async (req, res) => {
  const { area } = req.query;

  if (!["los_angeles", "newark"].includes(area)) {
    return res.status(400).json({
      error: "Choose los_angeles or newark."
    });
  }

  try {
    const found = await searchAdzunaAudioJobs(area);

    res.json({
      source: "Adzuna",
      area,
      attribution:
        "Open each listing using its Adzuna redirect link.",
      jobs: found
    });
  } catch (error) {
    console.error(
      "Could not search Adzuna audio jobs:",
      error.message
    );
    res.status(502).json({
      error: "Could not fetch audio jobs."
    });
  }
});

app.post("/api/resume/compare-preview", (req, res) => {
  const result = compareResume(req.body);

  if (result.error) {
    return res.status(400).json(result);
  }

  res.json(result);
});

app.post("/api/resume/keyword-overlap", (req, res) => {
  const result = keywordOverlap(req.body);

  if (result.error) {
    return res.status(400).json(result);
  }

  res.json(result);
});

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Set MONGODB_URI in backend/.env.");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  app.listen(port, "127.0.0.1", () => {
    console.log(`Job Match API listening on http://127.0.0.1:${port}`);
  });
}

start().catch((error) => {
  console.error("Could not start Job Match API:", error);
  process.exit(1);
});
