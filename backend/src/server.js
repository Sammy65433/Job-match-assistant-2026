import "dotenv/config";
import mongoose from "mongoose";

import { createApp } from "./app.js";
import { startDiscoveryRefresh } from "./scheduler.js";

const port = Number(process.env.PORT) || 5003;

function validateEnvironment() {
  if (!process.env.MONGODB_URI || !process.env.JOB_AUTH_SECRET) {
    throw new Error("MONGODB_URI and JOB_AUTH_SECRET must be configured.");
  } // end if missing env

  if (process.env.JOB_AUTH_SECRET.length < 32) {
    throw new Error("JOB_AUTH_SECRET must be at least 32 characters.");
  } // end if short secret
} // end validateEnvironment

async function start() {
  validateEnvironment();

  await mongoose.connect(process.env.MONGODB_URI);

  const app = createApp();
  const host =
    process.env.HOST ||
    (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

  app.listen(port, host, () => {
    console.log(`Job Match API listening on ${host}:${port}`);
    startDiscoveryRefresh();
  }); // end listen
} // end start

start().catch((error) => {
  console.error("Could not start Job Match API:", error);
  process.exit(1);
});
