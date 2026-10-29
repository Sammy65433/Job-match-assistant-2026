import { Router } from "express";
import mongoose from "mongoose";

import { STATUSES } from "../config.js";
import { requireJobUser } from "../middleware/requireJobUser.js";
import SavedJob from "../models/SavedJob.js";
import {
  validCompany,
  validDescription,
  validListingUrl,
  validSkills,
  validSource,
  validSourceJobId,
  validTitle,
  validTrack
} from "../validation.js";

const router = Router();

const MAX_INTERVIEWS = 20;

function cleanedText(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
} // end cleanedText

router.use(requireJobUser);

router.get("/", async (req, res) => {
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
    return res.status(500).json({ error: "Could not load saved jobs." });
  }
});

router.post("/from-listing", async (req, res) => {
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
    !validTitle(title) ||
    !validCompany(company) ||
    !validDescription(description) ||
    !validSource(source) ||
    !validSourceJobId(sourceJobId) ||
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
    return res.status(500).json({ error: "Could not save listing." });
  }
});

router.post("/", async (req, res) => {
  const { track, title, company, description, requiredSkills } =
    req.body ?? {};

  if (
    !validTrack(track) ||
    !validTitle(title) ||
    !validCompany(company) ||
    !validDescription(description, { required: true }) ||
    !validSkills(requiredSkills)
  ) {
    return res.status(400).json({ error: "Invalid saved job." });
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
    return res.status(500).json({ error: "Could not save job." });
  }
});

router.put("/:id/interviews", async (req, res) => {
  const { interviews } = req.body ?? {};

  if (!Array.isArray(interviews) || interviews.length > MAX_INTERVIEWS) {
    return res
      .status(400)
      .json({ error: `Provide up to ${MAX_INTERVIEWS} interview rounds.` });
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid job id." });
  }

  const parsed = [];

  for (const item of interviews) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return res.status(400).json({ error: "Invalid interview round." });
    }

    if (
      typeof item.scheduledAt !== "string" ||
      !Number.isFinite(Date.parse(item.scheduledAt))
    ) {
      return res.status(400).json({ error: "Invalid interview date." });
    }

    parsed.push({
      scheduledAt: new Date(item.scheduledAt),
      round: cleanedText(item.round, 80),
      contact: cleanedText(item.contact, 120),
      location: cleanedText(item.location, 300),
      notes: cleanedText(item.notes, 2000)
    });
  }

  parsed.sort((a, b) => a.scheduledAt - b.scheduledAt);

  try {
    const currentJob = await SavedJob.findOne({
      _id: req.params.id,
      ownerId: req.jobUser.id
    });

    if (!currentJob) {
      return res.status(404).json({ error: "Saved job not found." });
    }

    const update = {
      interviews: parsed,
      interviewAt: parsed.length ? parsed[0].scheduledAt : null
    };

    if (
      parsed.length > 0 &&
      currentJob.status !== "closed" &&
      currentJob.status !== "rejected"
    ) {
      update.status = "interview";
    }

    const savedJob = await SavedJob.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.jobUser.id },
      { $set: update },
      { returnDocument: "after", runValidators: true }
    ).lean();

    return res.json({ savedJob });
  } catch (error) {
    console.error("Could not save interview rounds:", error);
    return res.status(500).json({ error: "Could not save interview rounds." });
  }
});

router.patch("/:id/status", async (req, res) => {
  const body = req.body ?? {};
  const { status, interviewAt, appliedAt } = body;
  const hasInterviewAt = Object.prototype.hasOwnProperty.call(
    body,
    "interviewAt"
  );
  const hasAppliedAt = Object.prototype.hasOwnProperty.call(body, "appliedAt");

  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid job id." });
  }

  let parsedInterviewAt;
  if (hasInterviewAt) {
    if (status !== "interview") {
      return res
        .status(400)
        .json({ error: "Interview date requires interview status." });
    }

    if (
      interviewAt !== null &&
      (typeof interviewAt !== "string" ||
        !Number.isFinite(Date.parse(interviewAt)))
    ) {
      return res.status(400).json({ error: "Invalid interview date." });
    }

    parsedInterviewAt = interviewAt === null ? null : new Date(interviewAt);
  }

  let parsedAppliedAt;
  if (hasAppliedAt) {
    if (
      appliedAt !== null &&
      (typeof appliedAt !== "string" ||
        !Number.isFinite(Date.parse(appliedAt)))
    ) {
      return res.status(400).json({ error: "Invalid applied date." });
    }

    parsedAppliedAt = appliedAt === null ? null : new Date(appliedAt);
  }

  try {
    const currentJob = await SavedJob.findOne({
      _id: req.params.id,
      ownerId: req.jobUser.id
    });

    if (!currentJob) {
      return res.status(404).json({ error: "Saved job not found." });
    }

    const update = { status };

    if (status === "saved" || status === "ready") {
      update.appliedAt = null;
    } else if (hasAppliedAt) {
      update.appliedAt = parsedAppliedAt;
    } else if (status === "applied" && !currentJob.appliedAt) {
      update.appliedAt = new Date();
    }

    if (hasInterviewAt) {
      update.interviewAt = parsedInterviewAt;
    }

    const savedJob = await SavedJob.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.jobUser.id },
      { $set: update },
      { returnDocument: "after", runValidators: true }
    ).lean();

    return res.json({ savedJob });
  } catch (error) {
    console.error("Could not update saved job:", error);
    return res.status(500).json({ error: "Could not update saved job." });
  }
});

export default router;
