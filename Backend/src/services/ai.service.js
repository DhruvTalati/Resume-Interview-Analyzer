const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the description",
    ),

  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview!"),
        intention: z
          .string()
          .describe(
            "The intention of interviewer behind asking the question!!",
          ),
        answer: z
          .string()
          .describe(
            "How to answer this  question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Technical questions that can be asked inn the interview along with their intention to ask that question",
    ),

  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            "The behavioral question can be asked in the interview!",
          ),
        intention: z
          .string()
          .describe(
            "The intention of interviewer behind asking the question!!",
          ),
        answer: z
          .string()
          .describe(
            "How to answer this  question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Behavioral questions that can be asked in the interview along with their intention to ask that question .",
    ),

  skillsGaps: z
    .array(
      z.object({
        skill: z
          .string()
          .describe("The skill in which the candidate is lacking!!"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe("The severity of this skill gap , i.e"),
      }),
    )
    .describe(
      "List of the skilled gaps in the candidate's profile along with their severity",
    ),

  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe(
            "The day number in the preparation plan , starting from day 1",
          ),
        focus: z
          .string()
          .describe(
            "The main focus of this day in the preparation plan, e.g. data structures, system design ,mock interviews effectively.",
          ),
        tasks: z
          .array(z.string())
          .describe("List of tasks to be done on this day!"),
      }),
    )
    .describe(
      "A day-wise preparation plan for the candidate to follow in or to crack the interview!",
    ),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `Generate an interview report for a candidate based on the following information :
  Resume: ${resume}
  Self Description: ${selfDescription}
  Job Description: ${jobDescription}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(interviewReportSchema),
    },
  });

  console.log(JSON.parse(response.text));
}

module.exports = generateInterviewReport;
