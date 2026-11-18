import { Router } from "express";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

import CompanyProfile from "../models/CompanyProfile.js";
import {
  generateApplicationAnswer,
  generateInterviewQuestions
} from "../companyAssistant.js";
import { requireJobUser } from "../middleware/requireJobUser.js";

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests. Wait a few minutes and try again." }
});

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
} // end clean

function sanitizeProfile(profile) {
  const safe = profile && typeof profile === "object" ? profile : {};

  return {
    fullName: clean(safe.fullName, 120),
    email: clean(safe.email, 200),
    phone: clean(safe.phone, 60),
    location: clean(safe.location, 160),
    links: clean(safe.links, 400)
  };
} // end sanitizeProfile

function publicProfile(profile) {
  const value =
    profile && typeof profile.toObject === "function"
      ? profile.toObject()
      : profile ?? {};

  const answers = Array.isArray(value.answers)
    ? value.answers.map((entry) => ({
        _id: entry._id,
        question: entry.question,
        answer: entry.answer,
        createdAt: entry.createdAt
      }))
    : [];

  return {
    _id: value._id,
    company: value.company,
    website: value.website || "",
    notes: value.notes || "",
    jobTitle: value.jobTitle || "",
    jobDescription: value.jobDescription || "",
    answers,
    interview: {
      questions: Array.isArray(value.interview?.questions)
        ? value.interview.questions
        : [],
      model: value.interview?.model || "",
      generatedAt: value.interview?.generatedAt || null
    },
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
} // end publicProfile

function notFound(res) {
  return res.status(404).json({ error: "Company profile not found." });
} // end notFound

function serverError(res, label, error) {
  console.error(`${label}:`, error.message);

  return res.status(error.status || 500).json({
    error:
      error.name === "GeminiError" || (error.status && error.status < 500)
        ? error.message
        : `Could not complete the ${label.toLowerCase()}.`
  });
} // end serverError

function profileFields(body) {
  return {
    company: clean(body?.company, 150),
    website: clean(body?.website, 300),
    notes: clean(body?.notes, 15000),
    jobTitle: clean(body?.jobTitle, 150),
    jobDescription: clean(body?.jobDescription, 15000)
  };
} // end profileFields

async function findOwned(id, ownerId) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  return CompanyProfile.findOne({ _id: id, ownerId });
} // end findOwned

router.use(requireJobUser);

router.get("/", async (req, res) => {
  try {
    const profiles = await CompanyProfile.find({ ownerId: req.jobUser.id })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    return res.json({ profiles: profiles.map(publicProfile) });
  } catch (error) {
    return serverError(res, "Company list failed", error);
  } // end try/catch
});

router.get("/:id", async (req, res) => {
  try {
    const profile = await findOwned(req.params.id, req.jobUser.id);

    if (!profile) return notFound(res);

    return res.json({ profile: publicProfile(profile) });
  } catch (error) {
    return serverError(res, "Company lookup failed", error);
  } // end try/catch
});

router.post("/", async (req, res) => {
  const fields = profileFields(req.body ?? {});

  if (!fields.company) {
    return res.status(400).json({ error: "Enter a company name." });
  } // end if missing company

  try {
    const profile = await CompanyProfile.create({
      ownerId: req.jobUser.id,
      ...fields
    });

    return res.status(201).json({ profile: publicProfile(profile) });
  } catch (error) {
    return serverError(res, "Company save failed", error);
  } // end try/catch
});

router.patch("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return notFound(res);

  const fields = profileFields(req.body ?? {});

  if (!fields.company) {
    return res.status(400).json({ error: "Enter a company name." });
  } // end if missing company

  try {
    const profile = await CompanyProfile.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.jobUser.id },
      fields,
      { returnDocument: "after", runValidators: true }
    ).lean();

    if (!profile) return notFound(res);

    return res.json({ profile: publicProfile(profile) });
  } catch (error) {
    return serverError(res, "Company update failed", error);
  } // end try/catch
});

router.delete("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return notFound(res);

  try {
    const profile = await CompanyProfile.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.jobUser.id
    });

    if (!profile) return notFound(res);

    return res.json({ ok: true });
  } catch (error) {
    return serverError(res, "Company delete failed", error);
  } // end try/catch
});

router.post("/:id/answers", aiLimiter, async (req, res) => {
  const question = clean(req.body?.question, 2000);

  if (!question) {
    return res.status(400).json({ error: "Enter the application question." });
  } // end if missing question

  try {
    const profile = await findOwned(req.params.id, req.jobUser.id);

    if (!profile) return notFound(res);

    const { answer, model } = await generateApplicationAnswer({
      ...profileFields(profile),
      question,
      resumeText: clean(req.body?.resumeText, 20000),
      profile: sanitizeProfile(req.body?.profile)
    });

    profile.answers.push({ question, answer, model });
    await profile.save();

    return res.status(201).json({
      answer: publicProfile(profile).answers.at(-1)
    });
  } catch (error) {
    return serverError(res, "Answer generation failed", error);
  } // end try/catch
});

router.delete("/:id/answers/:answerId", async (req, res) => {
  try {
    const profile = await findOwned(req.params.id, req.jobUser.id);

    if (!profile) return notFound(res);

    const answer = profile.answers.id(req.params.answerId);

    if (!answer) {
      return res.status(404).json({ error: "Saved answer not found." });
    } // end if missing answer

    profile.answers.pull(answer._id);
    await profile.save();

    return res.json({ ok: true });
  } catch (error) {
    return serverError(res, "Answer delete failed", error);
  } // end try/catch
});

router.post("/:id/interview-questions", aiLimiter, async (req, res) => {
  try {
    const profile = await findOwned(req.params.id, req.jobUser.id);

    if (!profile) return notFound(res);

    const { questions, model } = await generateInterviewQuestions({
      ...profileFields(profile),
      resumeText: clean(req.body?.resumeText, 20000),
      profile: sanitizeProfile(req.body?.profile)
    });

    profile.interview = {
      questions,
      model,
      generatedAt: new Date()
    };
    await profile.save();

    return res.status(201).json({
      interview: publicProfile(profile).interview
    });
  } catch (error) {
    return serverError(res, "Interview question generation failed", error);
  } // end try/catch
});

export default router;
