import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export function requireJobUser(req, res, next) {
  const match = /^Bearer (.+)$/i.exec(req.headers.authorization || "");

  if (!match) {
    return res.status(401).json({ error: "Sign in required." });
  }

  if (!process.env.JOB_AUTH_SECRET) {
    return res.status(503).json({ error: "Authentication unavailable." });
  }

  try {
    const payload = jwt.verify(match[1], process.env.JOB_AUTH_SECRET, {
      issuer: "job-match-assistant",
      algorithms: ["HS256"]
    });

    if (
      typeof payload.sub !== "string" ||
      !mongoose.isValidObjectId(payload.sub)
    ) {
      return res.status(401).json({ error: "Invalid session." });
    }

    req.jobUser = { id: payload.sub };
    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired session."
    });
  }
}
