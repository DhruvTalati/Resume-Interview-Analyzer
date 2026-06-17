const { GoogleGenAI, Behavior } = require("@google/genai");
require("dotenv").config();
const { z } = require("zod");
import { zodToJsonSchema } from "zod-to-json-schema";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const interviewReportSchema = z.object({
  technicalQuestions: z.array(
    z.object({
      question: z
        .string()
        .description("The technical question can be asked in the interview!"),
      intention: z
        .string()
        .description(
          "The intention of interviewer behind asking the question!!",
        ),
      answer: z
        .string()
        .description(
          "How to answer this  question, what points to cover, what approach to take etc.",
        ),
    }),
  ),
  behavioralQuestions: z.array(
    z.object({
      question: z
        .string()
        .description("The behavioral question can be asked in the interview!"),
      intention: z
        .string()
        .description(
          "The intention of interviewer behind asking the question!!",
        ),
      answer: z
        .string()
        .description(
          "How to answer this  question, what points to cover, what approach to take etc.",
        ),
    }),
  ),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {}

module.exports = invokeGeminiAi;
