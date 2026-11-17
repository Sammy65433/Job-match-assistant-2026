import { Router } from "express";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

import {
  COVER_LETTER_TONES,
  generateCoverLetter
} from "../coverLetter.js";
import { requireJobUser } from "../middleware/requireJobUser.js";
import CoverLetter from "../models/CoverLetter.js";
import { validTrack } from "../validation.js";

const router = Router();

const MAX_COMPANY_LENGTH = 150;
const MAX_ROLE_LENGTH = 150;
const MAX_JOB_LENGTH = 15000;
const MAX_RESUME_LENGTH = 20000;
const MAX_LETTER_LENGTH = 12000;
const MAX_PROFILE_FIELD = 400;

const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many cover letters. Wait a few minutes and try again."
  }
});

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function sanitizeProfile(profile) {
  if (!profile || typeof profile !== "object") return {};

  return {
    fullName: clean(profile.fullName, 120),
    email: clean(profile.email, 200),
    phone: clean(profile.phone, 60),
    location: clean(profile.location, 160),
    links: clean(profile.links, MAX_PROFILE_FIELD)
  };
}

function publicDraft(draft) {
  return {
    _id: draft._id,
    track: draft.track,
    company: draft.company,
    role: draft.role,
    tone: draft.tone,
    jobDescription: draft.jobDescription,
    letter: draft.letter,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt
  };
}

router.use(requireJobUser);

router.get("/", async (req, res) => {
  const { track } = req.query;

  if (!validTrack(track)) {
    return res.status(400).json({ error: "Invalid career track." });
  }

  try {
    const drafts = await CoverLetter.find({
      ownerId: req.jobUser.id,
      track
    })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    return res.json({ drafts: drafts.map(publicDraft) });
  } catch (error) {
    console.error("Could not load cover letters:", error.message);
    return res.status(500).json({ error: "Could not load cover letters." });
  }
});

router.post("/", generateLimiter, async (req, res) => {
  const {
    track,
    company,
    role,
    tone = "professional",
    jobDescription,
    resumeText,
    profile
  } = req.body ?? {};

  const cleanedCompany = clean(company, MAX_COMPANY_LENGTH);
  const cleanedRole = clean(role, MAX_ROLE_LENGTH);
  const cleanedJob = clean(jobDescription, MAX_JOB_LENGTH);
  const cleanedResume = clean(resumeText, MAX_RESUME_LENGTH);
  const cleanedTone =
    typeof tone === "string" && Object.hasOwn(COVER_LETTER_TONES, tone)
      ? tone
      : "";

  if (
    !validTrack(track) ||
    !cleanedCompany ||
    !cleanedRole ||
    !cleanedJob ||
    !cleanedResume ||
    !cleanedTone
  ) {
    return res.status(400).json({
      error:
        "Add the company, role, pasted job info, your background, and a valid track."
    });
  }

  try {
    const { letter, model } = await generateCoverLetter({
      company: cleanedCompany,
      role: cleanedRole,
      jobDescription: cleanedJob,
      resumeText: cleanedResume,
      tone: cleanedTone,
      profile: sanitizeProfile(profile)
    });

    const draft = await CoverLetter.create({
      ownerId: req.jobUser.id,
      track,
      company: cleanedCompany,
      role: cleanedRole,
      tone: cleanedTone,
      jobDescription: cleanedJob,
      resumeText: cleanedResume,
      letter,
      model
    });

    return res.status(201).json({ draft: publicDraft(draft) });
  } catch (error) {
    console.error("Cover letter generation failed:", error.message);
    return res.status(error.status || 500).json({
      error:
        error.status && error.status < 500
          ? error.message
          : "Could not generate a cover letter."
    });
  }
});

router.patch("/:id", async (req, res) => {
  const body = req.body ?? {};
  const updates = {};

  if (body.letter !== undefined) {
    const letter = clean(body.letter, MAX_LETTER_LENGTH);

    if (!letter) {
      return res.status(400).json({ error: "The cover letter is empty." });
    }

    updates.letter = letter;
  }

  if (body.company !== undefined) {
    const company = clean(body.company, MAX_COMPANY_LENGTH);

    if (!company) {
      return res.status(400).json({ error: "Company is required." });
    }

    updates.company = company;
  }

  if (body.role !== undefined) {
    const role = clean(body.role, MAX_ROLE_LENGTH);

    if (!role) {
      return res.status(400).json({ error: "Role is required." });
    }

    updates.role = role;
  }

  if (body.tone !== undefined) {
    if (!Object.hasOwn(COVER_LETTER_TONES, body.tone)) {
      return res.status(400).json({ error: "Invalid tone." });
    }

    updates.tone = body.tone;
  }

  if (body.jobDescription !== undefined) {
    const jobDescription = clean(body.jobDescription, MAX_JOB_LENGTH);

    if (!jobDescription) {
      return res.status(400).json({ error: "Job info is required." });
    }

    updates.jobDescription = jobDescription;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "Nothing to update." });
  }

  try {
    const draft = await CoverLetter.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.jobUser.id },
      updates,
      { new: true, returnDocument: "after" }
    ).lean();

    if (!draft) {
      return res.status(404).json({ error: "Cover letter not found." });
    }

    return res.json({ draft: publicDraft(draft) });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return res.status(404).json({ error: "Cover letter not found." });
    }

    console.error("Could not update cover letter:", error.message);
    return res.status(500).json({ error: "Could not update cover letter." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const draft = await CoverLetter.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.jobUser.id
    });

    if (!draft) {
      return res.status(404).json({ error: "Cover letter not found." });
    }

    return res.json({ deleted: true });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return res.status(404).json({ error: "Cover letter not found." });
    }

    console.error("Could not delete cover letter:", error.message);
    return res.status(500).json({ error: "Could not delete cover letter." });
  }
});

export default router;
