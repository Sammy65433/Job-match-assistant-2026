import mongoose from "mongoose";

import { TRACKS } from "../config.js";

const coverLetterSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobUser",
      required: true,
      index: true,
      select: false
    },
    track: {
      type: String,
      enum: TRACKS,
      required: true
    },
    company: { type: String, required: true, trim: true, maxlength: 150 },
    role: { type: String, required: true, trim: true, maxlength: 150 },
    tone: { type: String, default: "professional", trim: true, maxlength: 40 },
    jobDescription: {
      type: String,
      default: "",
      trim: true,
      maxlength: 15000
    },
    resumeText: {
      type: String,
      default: "",
      trim: true,
      maxlength: 20000,
      select: false
    },
    letter: { type: String, required: true, trim: true, maxlength: 12000 },
    model: { type: String, default: "", trim: true, maxlength: 80 }
  },
  { timestamps: true }
);

coverLetterSchema.index({ ownerId: 1, updatedAt: -1 });

export default mongoose.model("CoverLetter", coverLetterSchema);
