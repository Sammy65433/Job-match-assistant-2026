import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { jobs } from "../data/jobs.js";
import { matchJob } from "./match.js";
import SavedJob from "./models/SavedJob.js";
import { discoverRemoteJobs } from "./discover.js";
import { searchAdzunaAudioJobs } from "./adzuna.js";



const app = express();
const port = Number(process.env.PORT) || 5003;

app.use(cors());
app.use(express.json({ limit: "100kb" }));

const validSkills = (skills) =>
  Array.isArray(skills) &&
  skills.length > 0 &&
  skills.length <= 100 &&
  skills.every(
    (skill) =>
      typeof skill === "string" &&
      skill.trim().length > 0 &&
      skill.length <= 100
  );

const validTrack = (track) =>
  ["software", "data", "audio"].includes(track);

const cleanSkills = (skills) =>
  skills.map((skill) => skill.trim());

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
  const { skills, title, company, description, requiredSkills } =
    req.body ?? {};

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
  const { track, title, company, description, requiredSkills } =
    req.body ?? {};

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
      error: "Provide a track, title, company, description, and required skills."
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
app.get("/api/discover/remote", async (req, res) => {
  const { track } = req.query;

  if (track !== "software" && track !== "data") {
    return res.status(400).json({ error: "Choose the software or data track." });
  } // end if invalid track

  try {
    const { jobs: found, errors } = await discoverRemoteJobs(track);
    res.json({ track, jobs: found, errors });
  } catch (error) {
    console.error("Could not discover remote jobs:", error);
    res.status(502).json({ error: "Could not fetch job listings." });
  } // end try/catch
}); // end route

app.get("/api/discover/audio", async (req, res) => {
  const { area } = req.query;

  if (!["los_angeles", "newark"].includes(area)) {
    return res.status(400).json({
      error: "Choose los_angeles or newark."
    });
  }

  try {
    const jobs = await searchAdzunaAudioJobs(area);

    res.json({
      source: "Adzuna",
      area,
      attribution: "Open each listing using its Adzuna redirect link.",
      jobs
    });
  } catch (error) {
    console.error("Could not search Adzuna audio jobs:", error.message);
    res.status(502).json({ error: "Could not fetch audio jobs." });
  }
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
