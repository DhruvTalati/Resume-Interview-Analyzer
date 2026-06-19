const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the job describe",
    ),
  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Technical questions that can be asked in the interview along with their intention and how to answer them",
    ),
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Behavioral questions that can be asked in the interview along with their intention and how to answer them",
    ),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe(
            "The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances",
          ),
      }),
    )
    .describe(
      "List of skill gaps in the candidate's profile along with their severity",
    ),
  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe("The day number in the preparation plan, starting from 1"),
        focus: z
          .string()
          .describe(
            "The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc.",
          ),
        tasks: z
          .array(z.string())
          .describe(
            "List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.",
          ),
      }),
    )
    .describe(
      "A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively",
    ),
  title: z
    .string()
    .describe(
      "The title of the job for which the interview report is generated",
    ),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `
You are an interview preparation assistant.

Based on the candidate's resume, self description and job description,
generate an interview preparation report.

Return ONLY valid JSON.

Return EXACTLY this structure:

{
  "title": "Frontend Developer",
  "matchScore": 90,
  "technicalQuestions": [
    {
      "question": "",
      "intention": "",
      "answer": ""
    }
  ],
  "behavioralQuestions": [
    {
      "question": "",
      "intention": "",
      "answer": ""
    }
  ],
  "skillGaps": [
    {
      "skill": "",
      "severity": "low"
    }
  ],
  "preparationPlan": [
    {
      "day": 1,
      "focus": "",
      "tasks": [""]
    }
  ]
}

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(interviewReportSchema),
    },
  });

  console.log("RAW GEMINI RESPONSE:");
  console.log(response.text);

  let parsed = JSON.parse(response.text);

  if (Array.isArray(parsed.technicalQuestions)) {
    parsed.technicalQuestions = parsed.technicalQuestions.map((q) => ({
      question: q,
      intention: "Technical Assessment",
      answer: "Prepare a detailed explanation with examples.",
    }));
  }

  if (Array.isArray(parsed.behavioralQuestions)) {
    parsed.behavioralQuestions = parsed.behavioralQuestions.map((q) => ({
      question: q,
      intention: "Behavioral Assessment",
      answer: "Answer using the STAR method.",
    }));
  }

  if (Array.isArray(parsed.skillGaps)) {
    parsed.skillGaps = parsed.skillGaps.map((skill) => ({
      skill:
        typeof skill === "string"
          ? skill.split("Severity")[0].trim()
          : skill.skill,
      severity: "medium",
    }));
  }

  if (Array.isArray(parsed.preparationPlan)) {
    parsed.preparationPlan = parsed.preparationPlan.map((item, index) => ({
      day: index + 1,
      focus: typeof item === "string" ? item : item.focus,
      tasks: [typeof item === "string" ? item : item.focus],
    }));
  }

  const validated = interviewReportSchema.parse(parsed);

  return validated;

  if (Array.isArray(parsed)) {
    parsed = parsed[0];
  }

  return parsed;
}

async function generatePdfFromHtml(htmlContent) {
  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  console.log("Chrome launched successfully");
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  });

  await browser.close();

  return pdfBuffer;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const resumePdfSchema = z.object({
    html: z
      .string()
      .describe(
        "The HTML content of the resume which can be converted to PDF using any library like puppeteer",
      ),
  });

  const prompt = `
You are a professional ATS Resume Writer.

CRITICAL INSTRUCTIONS:

You MUST return ONLY a valid JSON object.

You MUST NOT return:
- Markdown
- Explanations
- Notes
- Candidate analysis
- Interview report
- Match score
- Technical questions
- Behavioral questions
- Skill gaps
- Preparation plans
- Profile section
- Target Role section
- Resume Content section
- "Generated Resume" heading

The response MUST exactly follow this schema:

{
  "html": "<html>...</html>"
}

The html field MUST contain a complete professional resume.

RESUME REQUIREMENTS:

1. Create a REAL PROFESSIONAL RESUME.

2. Resume sections MUST be:

- Header
- Professional Summary
- Technical Skills
- Education
- Experience
- Projects
- Achievements
- Certifications

3. Header MUST contain:
- Full Name
- Email
- Phone
- Location
- LinkedIn
- GitHub

4. Use modern ATS-friendly formatting.

5. Use clean HTML and inline CSS.

6. Use a white background.

7. Use professional typography.

8. DO NOT include:
- Job Description text
- Resume Content section
- Profile section
- Target Role section
- Any analysis
- Any explanation

9. Tailor the resume to the job description.

10. Highlight:
- React.js
- JavaScript
- Tailwind CSS
- Node.js
- Express.js
- MongoDB
- REST APIs
- Git/GitHub
- MERN Stack

11. Create a strong professional summary.

12. Rewrite project descriptions professionally.

13. Make the resume look like a real resume created by a human recruiter.

14. The generated HTML MUST begin with:

<html>
<head>
<style>
...
</style>
</head>
<body>

15. The generated HTML MUST end with:

</body>
</html>

16. Return ONLY JSON.

17. Do NOT wrap JSON inside markdown.

18. Do NOT return any text before or after JSON.

19. The response must be directly parsable by:

JSON.parse(response.text)

Candidate Resume:
${resume}

Self Description:
${selfDescription}

Target Job Description:
${jobDescription}
`;

  try {
    let response;

    for (let i = 0; i < 3; i++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
          },
        });

        break;
      } catch (err) {
        console.log(`Gemini attempt ${i + 1} failed`);

        if (i === 2) {
          throw err;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const jsonContent = JSON.parse(response.text);

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

    return pdfBuffer;
  } catch (error) {
    console.log("Gemini failed. Using fallback resume.");

    const fallbackHtml = `
    <html>
      <body style="font-family: Arial; padding: 30px;">
        <h1>Generated Resume</h1>

        <h2>Profile</h2>
        <p>${selfDescription}</p>

        <h2>Target Role</h2>
        <p>${jobDescription}</p>

        <h2>Resume Content</h2>
        <p>${resume}</p>
      </body>
    </html>
  `;

    return await generatePdfFromHtml(fallbackHtml);
  }
}

module.exports = { generateInterviewReport, generateResumePdf };
