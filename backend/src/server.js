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
import { signUp, signIn, currentUser } from "./auth.js";
import { requireJobUser } from "./middleware/requireJobUser.js";
import { signInWithGoogle } from "./googleAuth.js";
import rateLimit from "express-rate-limit";
import { discoverInPersonJobs } from "./inPerson.js";

const app = express();
const port = Number(process.env.PORT) || 5003;
const tracks = ["software", "data", "audio"];
const statuses = ["saved", "ready", "applied", "interview", "rejected"];
const sources = ["Remotive", "Jobicy", "Himalayas", "Adzuna", "The Muse"];


const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  process.env.NODE_ENV !== "production" && "http://localhost:5173",
  process.env.NODE_ENV !== "production" && "http://127.0.0.1:5173"
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed."));
    }
  })
);
app.use(express.json({ limit: "100kb" }));


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." }
}); // end authLimiter

app.use("/api/auth", authLimiter);
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
  return tracks.includes(track);
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

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/signup", signUp);
app.post("/api/auth/google", signInWithGoogle);
app.post("/api/auth/login", signIn);
app.get("/api/auth/me", requireJobUser, currentUser);

app.get("/api/jobs", (_req, res) => {
  res.json(jobs);
});

app.post("/api/matches", (req, res) => {
  if (!validSkills(req.body?.skills)) {
    return res.status(400).json({ error: "Invalid skills." });
  }

  const matches = jobs
    .map((job) => matchJob(job, { skills: req.body.skills }))
    .sort((a, b) => b.score - a.score);

  res.json({
    matches,
    reviewQueue: matches.filter((job) => job.inReviewQueue)
  });
});

app.post("/api/matches/custom", requireJobUser, (req, res) => {
  const {
    skills,
    title,
    company,
    description,
    requiredSkills
  } = req.body ?? {};

  if (
    !validSkills(skills) ||
    !validSkills(requiredSkills) ||
    typeof title !== "string" ||
    !title.trim() ||
    title.length > 150 ||
    typeof company !== "string" ||
    !company.trim() ||
    company.length > 150 ||
    typeof description !== "string" ||
    !description.trim() ||
    description.length > 10000
  ) {
    return res.status(400).json({ error: "Invalid job preview." });
  }

  res.json({
    match: matchJob(
      {
        id: "custom-preview",
        title: title.trim(),
        company: company.trim(),
        description: description.trim(),
        requiredSkills: requiredSkills.map((skill) => skill.trim()),
        location: "Not specified",
        remote: false,
        salaryMin: null
      },
      { skills }
    )
  });
});

app.get("/api/saved-jobs", requireJobUser, async (req, res) => {
  if (!validTrack(req.query.track)) {
    return res.status(400).json({ error: "Invalid career track." });
  }

  try {
    const savedJobs = await SavedJob.find({
      ownerId: req.jobUser.id,
      track: req.query.track
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ savedJobs });
  } catch (error) {
    console.error("Could not load saved jobs:", error);
    return res.status(500).json({
      error: "Could not load saved jobs."
    });
  }
});

app.post(
  "/api/saved-jobs/from-listing",
  requireJobUser,
  async (req, res) => {
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
      !sources.includes(source) ||
      typeof sourceJobId !== "string" ||
      !sourceJobId.trim() ||
      sourceJobId.length > 200 ||
      !validListingUrl(url)
    ) {
      return res.status(400).json({ error: "Invalid listing." });
    }

    try {
      const savedJob = await SavedJob.findOneAndUpdate(
        {
          ownerId: req.jobUser.id,
          source,
          sourceJobId: sourceJobId.trim()
        },
        {
          $setOnInsert: {
            ownerId: req.jobUser.id,
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

      return res.status(201).json({ savedJob });
    } catch (error) {
      console.error("Could not save listing:", error);
      return res.status(500).json({
        error: "Could not save listing."
      });
    }
  }
);

app.post("/api/saved-jobs", requireJobUser, async (req, res) => {
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
      error: "Invalid saved job."
    });
  }

  try {
    const savedJob = await SavedJob.create({
      ownerId: req.jobUser.id,
      track,
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      requiredSkills: requiredSkills.map((skill) => skill.trim())
    });

    return res.status(201).json({ savedJob });
  } catch (error) {
    console.error("Could not save job:", error);
    return res.status(500).json({
      error: "Could not save job."
    });
  }
});

app.patch(
  "/api/saved-jobs/:id/status",
  requireJobUser,
  async (req, res) => {
    const { status } = req.body ?? {};

    if (!statuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid job id." });
    }

    try {
      const currentJob = await SavedJob.findOne({
        _id: req.params.id,
        ownerId: req.jobUser.id
      });

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

      const savedJob = await SavedJob.findOneAndUpdate(
        { _id: req.params.id, ownerId: req.jobUser.id },
        { $set: update },
        { returnDocument: "after", runValidators: true }
      ).lean();

      return res.json({ savedJob });
    } catch (error) {
      console.error("Could not update saved job:", error);
      return res.status(500).json({
        error: "Could not update saved job."
      });
    }
  }
);

app.get("/api/discover/remote", async (req, res) => {
  if (!["software", "data"].includes(req.query.track)) {
    return res.status(400).json({
      error: "Choose the software or data track."
    });
  }

  try {
    const { jobs: found, errors, stats } =
      await discoverRemoteJobs(req.query.track);

    return res.json({
      track: req.query.track,
      jobs: found,
      errors,
      stats
    });
  } catch (error) {
    console.error("Could not discover remote jobs:", error);
    return res.status(502).json({
      error: "Could not fetch job listings."
    });
  }
});
app.get("/api/discover/in-person", async (req, res) => {
  const { track, area } = req.query;

  if (!["software", "data"].includes(track)) {
    return res.status(400).json({ error: "Choose the software or data track." });
  } // end if invalid track

  if (!["los_angeles", "newark"].includes(area)) {
    return res.status(400).json({ error: "Choose los_angeles or newark." });
  } // end if invalid area

  try {
    const { jobs: found, errors, stats } = await discoverInPersonJobs(track, area);
    return res.json({ track, area, jobs: found, errors, stats });
  } catch (error) {
    console.error("Could not discover in-person jobs:", error.message);
    return res.status(502).json({ error: "Could not fetch job listings." });
  } // end try/catch
}); // end route

app.get("/api/discover/audio", async (req, res) => {
  if (!["los_angeles", "newark"].includes(req.query.area)) {
    return res.status(400).json({
      error: "Choose los_angeles or newark."
    });
  }

  try {
    const found = await searchAdzunaAudioJobs(req.query.area);

    return res.json({
      source: "Adzuna",
      area: req.query.area,
      attribution:
        "Open each listing using its Adzuna redirect link.",
      jobs: found
    });
  } catch (error) {
    console.error("Audio discovery failed:", error.message);
    return res.status(502).json({
      error: "Could not fetch audio jobs."
    });
  }
});

app.post(
  "/api/resume/compare-preview",
  requireJobUser,
  (req, res) => {
    const result = compareResume(req.body);

    return result.error
      ? res.status(400).json(result)
      : res.json(result);
  }
);

app.post(
  "/api/resume/keyword-overlap",
  requireJobUser,
  (req, res) => {
    const result = keywordOverlap(req.body);

    return result.error
      ? res.status(400).json(result)
      : res.json(result);
  }
);
app.use((error, _req, res, _next) => {
  if (error.message === "Origin not allowed.") {
    return res.status(403).json({ error: "Origin not allowed." });
  } // end if cors

  if (error.type === "entity.too.large") {
    return res.status(413).json({ error: "Request is too large." });
  } // end if too large

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON." });
  } // end if bad json

  console.error("Unexpected error:", error.message);
  return res.status(500).json({ error: "Something went wrong." });
}); // end error handler

async function start() {
  if (!process.env.MONGODB_URI || !process.env.JOB_AUTH_SECRET) {
    throw new Error("MONGODB_URI and JOB_AUTH_SECRET must be configured.");
  } // end if missing env

  if (process.env.JOB_AUTH_SECRET.length < 32) {
    throw new Error("JOB_AUTH_SECRET must be at least 32 characters.");
  } // end if short secret

  await mongoose.connect(process.env.MONGODB_URI);

  const host = process.env.HOST || "127.0.0.1";

  app.listen(port, "0.0.0.0", () => {
  console.log(`Job Match API listening on port ${port}`);
});
 // end listen
} // end start


start().catch((error) => {
  console.error("Could not start Job Match API:", error);
  process.exit(1);
});
