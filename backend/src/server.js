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

const VALID_STATUS = ["saved", "ready", "applied", "interview", "rejected"];

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
  } // end if invalid skills

  const matches = jobs
    .map((job) => matchJob(job, { skills }))
    .sort((a, b) => b.score - a.score);

  res.json({
    matches,
    reviewQueue: matches.filter((job) => job.inReviewQueue)
  });
}); // end route

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
  } // end if invalid body

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
}); // end route

app.get("/api/saved-jobs", async (req, res) => {
  const { track } = req.query;

  if (!validTrack(track)) {
    return res.status(400).json({ error: "Invalid career track." });
  } // end if invalid track

  try {
    const savedJobs = await SavedJob.find({ track })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ savedJobs });
  } catch (error) {
    console.error("Could not load saved jobs:", error);
    res.status(500).json({ error: "Could not load saved jobs." });
  } // end try/catch
}); // end route

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
  } // end if invalid body

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
  } // end try/catch
}); // end route

/* ---------- NEW: change a saved job's application status ---------- */
app.patch("/api/saved-jobs/:id/status", async (req, res) => {
  const { status } = req.body ?? {};

  if (!VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  } // end if invalid status

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid job id." });
  } // end if invalid id

  try {
    const update = { status };

    if (status === "applied") {
      update.appliedAt = new Date();
    } // end if applied

    const savedJob = await SavedJob.findByIdAndUpdate(req.params.id, update, {
      new: true
    }).lean();

    if (!savedJob) {
      return res.status(404).json({ error: "Saved job not found." });
    } // end if not found

    res.json({ savedJob });
  } catch (error) {
    console.error("Could not update status:", error);
    res.status(500).json({ error: "Could not update status." });
  } // end try/catch
}); // end route

app.get("/api/discover/remote", async (req, res) => {
  const { track } = req.query;

  if (track !== "software" && track !== "data") {
    return res.status(400).json({ error: "Choose the software or data track." });
  } // end if invalid track

  try {
    const { jobs: found, errors, stats } = await discoverRemoteJobs(track);
    res.json({ track, jobs: found, errors, stats });
  } catch (error) {
    console.error("Could not discover remote jobs:", error);
    res.status(502).json({ error: "Could not fetch job listings." });
  } // end try/catch
}); // end route

app.get("/api/discover/audio", async (req, res) => {
  const { area } = req.query;

  if (!["los_angeles", "newark"].includes(area)) {
    return res.status(400).json({ error: "Choose los_angeles or newark." });
  } // end if invalid area

  try {
    const found = await searchAdzunaAudioJobs(area);

    res.json({
      source: "Adzuna",
      area,
      attribution: "Open each listing using its Adzuna redirect link.",
      jobs: found
    });
  } catch (error) {
    console.error("Could not search Adzuna audio jobs:", error.message);
    res.status(502).json({ error: "Could not fetch audio jobs." });
  } // end try/catch
}); // end route
app.post("/api/resume/compare-preview", (req, res) => {
  const result = compareResume(req.body);

  if (result.error) {
    return res.status(400).json(result);
  } // end if error

  res.json(result);
}); // end route
app.post("/api/resume/keyword-overlap", (req, res) => {
  const result = keywordOverlap(req.body);

  if (result.error) {
    return res.status(400).json(result);
  } // end if error

  res.json(result);
}); // end route


async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Set MONGODB_URI in backend/.env.");
  } // end if no uri

  await mongoose.connect(process.env.MONGODB_URI);

  app.listen(port, "127.0.0.1", () => {
    console.log(`Job Match API listening on http://127.0.0.1:${port}`);
  }); // end listen
} // end start

start().catch((error) => {
  console.error("Could not start Job Match API:", error);
  process.exit(1);
}); // end catch