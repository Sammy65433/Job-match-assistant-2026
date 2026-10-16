import mongoose from "mongoose";

const savedJobSchema = new mongoose.Schema(
  {
    track: {
      type: String,
      enum: ["software", "data", "audio"],
      required: true
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    company: { type: String, required: true, trim: true, maxlength: 150 },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000
    },
    requiredSkills: {
      type: [String],
      required: true,
      validate: {
        validator: (skills) => skills.length > 0 && skills.length <= 100,
        message: "Enter between 1 and 100 required skills."
      }
    },
    status: {
      type: String,
      enum: ["saved", "ready", "applied", "interview", "rejected"],
      default: "saved"
    },
    appliedAt: { type: Date, default: null }
  },
  { timestamps: true }
); // end schema

export default mongoose.model("SavedJob", savedJobSchema);