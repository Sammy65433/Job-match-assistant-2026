import { Router } from "express";

import { requireJobUser } from "../middleware/requireJobUser.js";
import { compareResume } from "../resumeCompare.js";
import {
  compareFullJobDescription,
  keywordOverlap
} from "../keywordOverlap.js";

const router = Router();

router.use(requireJobUser);

router.post("/compare-preview", (req, res) => {
  const result = compareResume(req.body);

  return result.error ? res.status(400).json(result) : res.json(result);
});

router.post("/keyword-overlap", (req, res) => {
  const result = keywordOverlap(req.body);

  return result.error ? res.status(400).json(result) : res.json(result);
});

router.post("/full-description", (req, res) => {
  const result = compareFullJobDescription(req.body);

  return result.error ? res.status(400).json(result) : res.json(result);
});

export default router;
