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

The response MUST strictly follow the response schema provided by the API.

Do not invent your own structure.

Do not change property names.

Every field must match the required type.

Requirements:

- title must be a string.
- matchScore must be a number between 0 and 100.

- technicalQuestions must be an array of objects.

Each technical question object must contain:

- question
- intention
- answer

- behavioralQuestions must be an array of objects.

Each behavioral question object must contain:

- question
- intention
- answer

- skillGaps must be an array of objects.

Each skill gap object must contain:

- skill
- severity

severity must be one of:

low
medium
high

- preparationPlan must be an array of objects.

Each preparation plan object must contain:

- day (NUMBER ONLY)

Examples:

Correct:

{
  "day": 1
}

{
  "day": 2
}

{
  "day": 3
}

Incorrect:

{
  "day": "Day 1"
}

{
  "day": "Day 1: Frontend"
}

{
  "day": "First Day"
}

focus must be a string.

tasks must be an array of strings.

IMPORTANT:

The "day" field must be an integer only.

Do NOT include any text inside the day field.

Examples:

Correct:

"day": 1

Wrong:

"day": "Day 1"

Wrong:

"day": "Day 1: React"

Wrong:

"day": "First Day"

Do NOT return arrays of numbers.

Do NOT return arrays of strings.

Do NOT omit any required property.

Do NOT return markdown.

Do NOT return explanations.

Do NOT return any text before or after the JSON.

Return ONLY the JSON object.

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;

  let response;

  for (let i = 0; i < 3; i++) {
    try {
      console.log("Calling Gemini API...");
      console.log(`Gemini Attempt ${i + 1}`);
      response = await Promise.race([
        ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Gemini timeout")), 60000),
        ),
      ]);
      console.log("Calling Gemini API...");
      console.log("Gemini Success");

      break;
    } catch (err) {
      console.error(`Gemini Attempt ${i + 1} Failed`);
      console.error("Status:", err.status);
      console.error("Message:", err.message);

      // Retry only when Gemini is temporarily unavailable
      if (err.status !== 503 && err.status !== 429) {
        throw err;
      }

      // Stop after the final attempt
      if (i === 2) {
        throw err;
      }

      const delay = (i + 1) * 5000;
      console.log(`Gemini is busy. Retrying in ${delay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.log("RAW GEMINI RESPONSE:");
  console.log(response.text);

  let parsed = JSON.parse(response.text);

  // Convert Gemini string responses into the object structure required by the schema

  parsed.technicalQuestions = (parsed.technicalQuestions || []).map((item) => {
    if (typeof item === "string") {
      return {
        question: item,
        intention: "Technical Assessment",
        answer: "Provide a detailed answer with practical examples.",
      };
    }
    return item;
  });

  parsed.behavioralQuestions = (parsed.behavioralQuestions || []).map(
    (item) => {
      if (typeof item === "string") {
        return {
          question: item,
          intention: "Behavioral Assessment",
          answer: "Answer using the STAR method.",
        };
      }
      return item;
    },
  );

  parsed.skillGaps = (parsed.skillGaps || []).map((item) => {
    if (typeof item === "string") {
      const match = item.match(
        /skill:\s*(.*?),\s*severity:\s*(low|medium|high)/i,
      );

      return {
        skill: match ? match[1].trim() : item,
        severity: match ? match[2].toLowerCase() : "medium",
      };
    }

    return item;
  });

  parsed.preparationPlan = (parsed.preparationPlan || []).map((item) => {
    if (typeof item === "string") {
      const dayMatch = item.match(/day:\s*(\d+)/i);
      const focusMatch = item.match(/focus:\s*([^,]+)/i);
      const tasksMatch = item.match(/tasks:\s*\[(.*)\]/i);

      let tasks = [];

      if (tasksMatch) {
        tasks = tasksMatch[1]
          .split(",")
          .map((t) => t.replace(/"/g, "").trim())
          .filter(Boolean);
      }

      return {
        day: dayMatch ? Number(dayMatch[1]) : 1,
        focus: focusMatch ? focusMatch[1].trim() : "",
        tasks,
      };
    }

    return item;
  });
  // Normalize Gemini response in case any array item is returned as a JSON string

  const parseIfString = (value) => {
    if (typeof value !== "string") {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  parsed.technicalQuestions =
    parsed.technicalQuestions?.map(parseIfString) || [];

  parsed.behavioralQuestions =
    parsed.behavioralQuestions?.map(parseIfString) || [];

  parsed.skillGaps = parsed.skillGaps?.map(parseIfString) || [];

  parsed.preparationPlan = parsed.preparationPlan?.map(parseIfString) || [];

  const validated = interviewReportSchema.parse(parsed);

  return validated;
}

async function generatePdfFromHtml(htmlContent) {
  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
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
- MarkdownIMPORTANT:
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

IMPORTANT:

- The value of "html" must be a plain HTML string.
- Do NOT escape the HTML.
- Do NOT return HTML as a JSON object.
- Do NOT include markdown code fences.
- Do NOT include explanations before or after the JSON.
- Return exactly one JSON object with one property: "html".

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
        console.log(`Gemini Attempt ${i + 1}`);

        rresponse = await Promise.race([
          ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: zodToJsonSchema(resumePdfSchema),
            },
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Gemini timeout")), 60000),
          ),
        ]);

        console.log("Gemini Success");

        break;
      } catch (err) {
        console.error(`Gemini Attempt ${i + 1} Failed`);
        console.error("Status:", err.status);
        console.error("Message:", err.message);

        // Retry only for temporary errors (503) and rate-limit errors (429)
        if (err.status !== 503 && err.status !== 429) {
          throw err;
        }

        // Stop after the final attempt
        if (i === 2) {
          throw err;
        }

        // Respect Gemini's suggested retry delay when available
        let delay = (i + 1) * 5000;

        const retryMatch = err.message?.match(/retry in ([\d.]+)s/i);

        if (retryMatch) {
          delay = Math.ceil(Number(retryMatch[1])) * 1000;
        }

        console.log(`Retrying in ${delay / 1000} seconds...`);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    const jsonContent = JSON.parse(response.text);
    console.log("JSON parsed successfully.");
    console.log("RAW RESUME RESPONSE:");
    console.log(response.text);
    console.log("Generating PDF...");

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
