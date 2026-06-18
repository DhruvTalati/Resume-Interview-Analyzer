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
          .describe("The behavioral question can be asked in the interview!"),
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
  title: z
    .string()
    .describe(
      "The title of the job for whcih the interview report is generated",
    ),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  // TEMPORARY MOCK DATA
  return {
    matchScore: 88,

    technicalQuestions: [
      {
        question: "What is JWT Authentication?",
        intention: "Check authentication knowledge",
        answer:
          "Explain token generation, signing, verification and middleware.",
      },
      {
        question: "What is React Virtual DOM?",
        intention: "Check React fundamentals",
        answer: "Explain how React updates the UI efficiently.",
      },
      {
        question: "Difference between SQL and MongoDB?",
        intention: "Check database knowledge",
        answer: "Compare relational and NoSQL databases.",
      },
      {
        question: "What are Express middlewares?",
        intention: "Check backend knowledge",
        answer: "Explain request-response lifecycle processing.",
      },
      {
        question: "What are REST APIs?",
        intention: "Check API design knowledge",
        answer: "Explain resources, HTTP methods and statelessness.",
      },
    ],

    behavioralQuestions: [
      {
        question: "Tell me about yourself.",
        intention: "Communication skills",
        answer: "Discuss education, projects and goals.",
      },
      {
        question: "Describe a challenge you faced.",
        intention: "Problem solving",
        answer: "Use STAR format.",
      },
      {
        question: "Why should we hire you?",
        intention: "Confidence and fit",
        answer: "Highlight skills and projects.",
      },
      {
        question: "How do you handle deadlines?",
        intention: "Time management",
        answer: "Discuss planning and prioritization.",
      },
      {
        question: "Have you worked in a team?",
        intention: "Teamwork assessment",
        answer: "Explain collaboration experience.",
      },
    ],

    skillsGaps: [
      {
        skill: "AWS",
        severity: "medium",
      },
      {
        skill: "Docker",
        severity: "medium",
      },
      {
        skill: "TypeScript",
        severity: "low",
      },
    ],

    preparationPlan: [
      {
        day: 1,
        focus: "React",
        tasks: ["Revise Hooks", "Practice Components"],
      },
      {
        day: 2,
        focus: "Node.js",
        tasks: ["Build APIs", "Middleware Practice"],
      },
      {
        day: 3,
        focus: "MongoDB",
        tasks: ["Aggregation", "Indexes"],
      },
      {
        day: 4,
        focus: "JWT",
        tasks: ["Authentication", "Authorization"],
      },
      {
        day: 5,
        focus: "DSA",
        tasks: ["Arrays", "Strings"],
      },
      {
        day: 6,
        focus: "Mock Interview",
        tasks: ["Technical Questions", "Behavioral Questions"],
      },
      {
        day: 7,
        focus: "Revision",
        tasks: ["Review Notes", "Project Explanation"],
      },
    ],
  };

  const prompt = `
You are an expert technical recruiter.

Analyze the candidate's resume, self description and job description.

IMPORTANT:
- Return ONLY valid JSON.
- Follow the provided schema exactly.
- matchScore must be between 0 and 100.
- Generate exactly 5 technicalQuestions.
- Generate exactly 5 behavioralQuestions.
- Generate at least 3 skillsGaps.
- Generate a 7-day preparationPlan.

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(interviewReportSchema),
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("FULL GEMINI ERROR:", error);
    throw error;
  }
}

module.exports = generateInterviewReport;
