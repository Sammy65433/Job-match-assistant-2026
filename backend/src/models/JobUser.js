import mongoose from "mongoose";

const jobUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254
    },
    passwordHash: {
      type: String,
      select: false
    },
    googleSub: {
      type: String,
      select: false
    }
  },
  { timestamps: true }
);

jobUserSchema.index(
  { googleSub: 1 },
  {
    unique: true,
    partialFilterExpression: { googleSub: { $type: "string" } }
  }
);

jobUserSchema.pre("validate", function () {
  if (!this.passwordHash && !this.googleSub) {
    this.invalidate(
      "passwordHash",
      "A password or Google identity is required."
    );
  }
});

export default mongoose.model("JobUser", jobUserSchema);
