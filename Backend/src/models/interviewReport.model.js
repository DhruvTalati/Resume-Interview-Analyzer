const mongoose = require("mongoose");

/**
 * -Job description schema
 * -Resume text
 * -Self description
 *
 * -Technical Questions : []
 * -Behavioral Questions :[]
 * -Skill gaps : []
 * -Preparation plan :[]
 */

const technicalQuestionsSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, "Technical Question is required!!"],
  },
  intention: {
    type: String,
    required: [true, "Intention is required!!"],
  },
  answer: {
    type: String,
    required: true,
  },
});

const behavioralQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, "Behavioral question is required!!"],
  },
  intention: {
    type: String,
    required: [true, "Intention is required!!"],
  },
  answer: {
    type: String,
    required: [true, "Answer is required!!"],
  },
});

const skillsGapsSchema = new mongoose.Schema({
  skill: {
    type: String,
    required: [true, "Skill is required!!"],
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high"],
    required: [true, "Severity is required!!"],
  },
});

const preparationPlanSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: [true, "Day is required!!"],
  },
  focus: {
    type: String,
    required: [true, "Focus is required!!"],
  },
  tasks: {
    type: [String],
    required: [true, "Task is required!!"],
  },
});

const interviewReportSchema = new mongoose.Schema(
  {
    jobDescription: {
      type: String,
      required: [true, "Job Description is required!!"],
    },
    resume: {
      type: String,
    },
    selfDescription: {
      type: String,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    technicalQuestions: [technicalQuestionsSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillsGaps: [skillsGapsSchema],
    preparationPlan: [preparationPlanSchema],

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    title: {
      type: String,
      required: [true, "Job title is required!!"],
    },
  },
  {
    timestamps: true,
  },
);

const interviewReportModel = mongoose.model(
  "InterviewReport",
  interviewReportSchema,
);

module.exports = interviewReportModel;
