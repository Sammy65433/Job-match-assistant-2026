import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    scheduledAt: { type: Date, required: true },
    round: { type: String, default: "", trim: true, maxlength: 80 },
    contact: { type: String, default: "", trim: true, maxlength: 120 },
    location: { type: String, default: "", trim: true, maxlength: 300 },
    notes: { type: String, default: "", trim: true, maxlength: 2000 }
  },
  { timestamps: true }
);

const savedJobSchema = new mongoose.Schema(
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
      enum: ["software", "data", "audio"],
      required: true
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    company: { type: String, required: true, trim: true, maxlength: 150 },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 10000
    },
    requiredSkills: { type: [String], default: [] },
    source: { type: String, default: "", trim: true, maxlength: 50 },
    url: { type: String, default: "", trim: true, maxlength: 2000 },
    sourceJobId: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200
    },
    status: {
      type: String,
      enum: ["saved", "ready", "applied", "interview", "closed", "rejected"],
      default: "saved"
    },
    appliedAt: { type: Date, default: null },
    interviewAt: { type: Date, default: null },
    interviews: { type: [interviewSchema], default: [] }
  },
  { timestamps: true }
);

savedJobSchema.index(
  { ownerId: 1, source: 1, sourceJobId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      source: { $gt: "" },
      sourceJobId: { $gt: "" }
    }
  }
);

export default mongoose.model("SavedJob", savedJobSchema);
