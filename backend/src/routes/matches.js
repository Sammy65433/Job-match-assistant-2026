import { Router } from "express";

import { jobs } from "../../data/jobs.js";
import { matchJob } from "../match.js";
import { requireJobUser } from "../middleware/requireJobUser.js";
import {
  validCompany,
  validDescription,
  validSkills,
  validTitle
} from "../validation.js";

const router = Router();

router.get("/jobs", (_req, res) => {
  res.json(jobs);
});

router.post("/matches", (req, res) => {
  if (!validSkills(req.body?.skills)) {
    return res.status(400).json({ error: "Invalid skills." });
  }

  const matches = jobs
    .map((job) => matchJob(job, { skills: req.body.skills }))
    .sort((a, b) => b.score - a.score);

  return res.json({
    matches,
    reviewQueue: matches.filter((job) => job.inReviewQueue)
  });
});

router.post("/matches/custom", requireJobUser, (req, res) => {
  const { skills, title, company, description, requiredSkills } = req.body ?? {};

  if (
    !validSkills(skills) ||
    !validSkills(requiredSkills) ||
    !validTitle(title) ||
    !validCompany(company) ||
    !validDescription(description, { required: true })
  ) {
    return res.status(400).json({ error: "Invalid job preview." });
  }

  return res.json({
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

export default router;
