import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import discoverRoutes from "./routes/discover.js";
import matchRoutes from "./routes/matches.js";
import resumeRoutes from "./routes/resume.js";
import savedJobRoutes from "./routes/savedJobs.js";
import applyRoutes from "./routes/apply.js";

export function createApp() {
  const app = express();

  // Render and most hosts sit behind one proxy/load balancer, which sets
  // X-Forwarded-For. express-rate-limit needs trust proxy enabled to read the
  // real client IP instead of throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
  const behindProxy =
    process.env.TRUST_PROXY === "1" ||
    process.env.RENDER === "true" ||
    process.env.NODE_ENV === "production";

  if (behindProxy) {
    app.set("trust proxy", 1);
  } // end if behind one proxy

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
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api", matchRoutes);
  app.use("/api/saved-jobs", savedJobRoutes);
  app.use("/api/apply", applyRoutes);
  app.use("/api/discover", discoverRoutes);
  app.use("/api/resume", resumeRoutes);

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
  });

  return app;
} // end createApp
