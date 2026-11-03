import { Router } from "express";

import { submitListingApplication } from "../apply.js";
import { requireJobUser } from "../middleware/requireJobUser.js";
import { validDescription, validListingUrl, validSource, validSourceJobId, validTitle } from "../validation.js";

const router = Router();

router.use(requireJobUser);

router.post("/", async (req, res) => {
  const { source, sourceJobId, url, title, description } = req.body ?? {};

  if (
    !validSource(source) ||
    !validSourceJobId(sourceJobId) ||
    !validListingUrl(url) ||
    !validTitle(title) ||
    !validDescription(description, { required: false })
  ) {
    return res.status(400).json({ error: "Invalid listing." });
  } // end if invalid

  try {
    const result = await submitListingApplication({
      source,
      sourceJobId,
      url,
      title,
      description
    });

    return res.json(result);
  } catch (error) {
    console.error("Could not submit listing application:", error.message);
    return res.status(500).json({ error: "Could not submit application." });
  } // end try/catch
}); // end router.post

export default router;
