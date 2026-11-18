import mongoose from "mongoose";

const { Schema } = mongoose;

const answerSchema = new Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 2000 },
    answer: { type: String, required: true, trim: true, maxlength: 12000 },
    model: { type: String, default: "", trim: true, maxlength: 80 }
  },
  { timestamps: true }
);

const interviewSchema = new Schema(
  {
    questions: { type: [String], default: [] },
    model: { type: String, default: "", trim: true, maxlength: 80 },
    generatedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const companyProfileSchema = new mongoose.Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "JobUser",
      required: true,
      index: true,
      select: false
    },
    company: { type: String, required: true, trim: true, maxlength: 150 },
    website: { type: String, default: "", trim: true, maxlength: 300 },
    notes: { type: String, default: "", trim: true, maxlength: 15000 },
    jobTitle: { type: String, default: "", trim: true, maxlength: 150 },
    jobDescription: { type: String, default: "", trim: true, maxlength: 15000 },
    answers: { type: [answerSchema], default: [] },
    interview: { type: interviewSchema, default: () => ({}) }
  },
  { timestamps: true }
);

companyProfileSchema.index({ ownerId: 1, updatedAt: -1 });

export default mongoose.model("CompanyProfile", companyProfileSchema);
