const mongoose = require("mongoose");

// ── Sub-schemas ───────────────────────────────────────────────────────────────
const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    intention: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false },
);

const skillGapSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    severity: { type: String, enum: ["low", "medium", "high"], required: true },
  },
  { _id: false },
);

const preparationPlanSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 1 },
    focus: { type: String, required: true },
    tasks: [{ type: String, required: true }],
  },
  { _id: false },
);

// ── Main schema ───────────────────────────────────────────────────────────────
const interviewReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true, // fast lookups by user
    },
    title: {
      type: String,
      required: [true, "Job title is required."],
      trim: true,
      maxlength: [200, "Title too long."],
    },
    jobDescription: { type: String, required: true },
    resume: { type: String, default: "" },
    selfDescription: { type: String, default: "" },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    technicalQuestions: [questionSchema],
    behavioralQuestions: [questionSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationPlanSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ── Compound index: user + createdAt for sorted user reports ──────────────────
interviewReportSchema.index({ user: 1, createdAt: -1 });

const interviewReportModel = mongoose.model(
  "InterviewReport",
  interviewReportSchema,
);

module.exports = interviewReportModel;
