const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

// ── Model fallback chain ──────────────────────────────────────────────────────
// If a model hits quota or overload, the next one is tried automatically
const MODELS = ["gemini-2.0-flash", "gemini-1.5-flash-8b", "gemini-1.5-flash"];

// ── Schemas ───────────────────────────────────────────────────────────────────
const interviewReportSchema = z.object({
  title: z.string().describe("Job title the interview report is generated for"),

  matchScore: z
    .number()
    .describe(
      "Score from 0–100 showing how well the candidate matches the job",
    ),

  technicalQuestions: z
    .array(
      z.object({
        question: z.string().describe("Technical interview question"),
        intention: z.string().describe("Why the interviewer asks this"),
        answer: z
          .string()
          .describe("How to answer — key points, approach, examples"),
      }),
    )
    .describe("Technical questions with intention and model answers"),

  behavioralQuestions: z
    .array(
      z.object({
        question: z.string().describe("Behavioral interview question"),
        intention: z.string().describe("Why the interviewer asks this"),
        answer: z.string().describe("How to answer using the STAR method"),
      }),
    )
    .describe("Behavioral questions with intention and model answers"),

  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("Missing or weak skill"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe("How critical this gap is for the role"),
      }),
    )
    .describe("Skill gaps with severity"),

  preparationPlan: z
    .array(
      z.object({
        day: z.number().int().positive().describe("Day number starting from 1"),
        focus: z.string().describe("Main topic for this day"),
        tasks: z.array(z.string()).describe("Specific tasks to complete today"),
      }),
    )
    .describe("Day-by-day preparation plan"),
});

const resumePdfSchema = z.object({
  html: z
    .string()
    .describe("Complete, self-contained HTML resume ready for PDF rendering"),
});

// ── Gemini caller with multi-model fallback ───────────────────────────────────
async function callGeminiWithFallback({ schema, prompt, timeoutMs = 90000 }) {
  let lastError;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`[Gemini] Model: ${model}  Attempt: ${attempt + 1}`);

        const response = await Promise.race([
          ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: zodToJsonSchema(schema),
            },
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Gemini timeout")), timeoutMs),
          ),
        ]);

        console.log(`[Gemini] Success — model: ${model}`);
        return response;
      } catch (err) {
        lastError = err;
        console.error(
          `[Gemini] Model: ${model}  Attempt: ${attempt + 1}  Failed`,
        );
        console.error(
          `         Status: ${err.status}  Message: ${err.message}`,
        );

        // Daily/minute quota fully exhausted — skip to next model immediately
        if (err.status === 429 && err.message?.includes("limit: 0")) {
          console.log(
            `[Gemini] Quota exhausted for ${model} — switching model`,
          );
          break; // inner loop → try next model
        }

        // Temporary overload or rate-limit — retry same model after delay
        if (err.status === 503 || err.status === 429) {
          if (attempt === 2) break; // give up on this model

          // Respect Gemini's suggested retry delay when available
          let delay = (attempt + 1) * 8000;
          const retryMatch = err.message?.match(/retry in ([\d.]+)s/i);
          if (retryMatch) delay = Math.ceil(parseFloat(retryMatch[1])) * 1000;

          console.log(`[Gemini] Retrying in ${delay / 1000}s...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        // Any other error (bad API key, schema mismatch, etc.) — fail fast
        throw err;
      }
    }
  }

  throw (
    lastError ||
    new Error("All Gemini models exhausted. Please try again later.")
  );
}

// ── Normalize helpers ─────────────────────────────────────────────────────────
const parseIfString = (v) => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};

const toQuestion = (defaultIntention, defaultAnswer) => (item) => {
  if (typeof item === "string") {
    return {
      question: item,
      intention: defaultIntention,
      answer: defaultAnswer,
    };
  }
  return item;
};

// ── generateInterviewReport ───────────────────────────────────────────────────
async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `
You are a senior career coach and technical interviewer with 15+ years of experience.

Analyze the candidate's profile against the job description and produce a complete, 
personalized interview preparation report.

═══════════════════════════════════
CANDIDATE RESUME:
${resume || "(No resume provided)"}

CANDIDATE SELF-DESCRIPTION:
${selfDescription || "(No self-description provided)"}

TARGET JOB DESCRIPTION:
${jobDescription}
═══════════════════════════════════

INSTRUCTIONS — read carefully before generating:

1. TITLE
   - Extract the exact job title from the job description.
   - Example: "Senior Frontend Engineer", "Data Analyst", "Product Manager"

2. MATCH SCORE (0–100)
   - Compare the candidate's skills, experience, and background against the job requirements.
   - Be accurate and realistic — not inflated.
   - 90–100: near-perfect fit  |  70–89: strong fit  |  50–69: moderate fit  |  <50: weak fit

3. TECHNICAL QUESTIONS (minimum 8, maximum 15)
   - Tailor every question to the SPECIFIC technologies and skills in this job description.
   - Cover: core concepts, problem-solving, system design, debugging, best practices.
   - Each question must have:
     • question:  The exact interview question as the interviewer would ask it.
     • intention: What competency or mindset the interviewer is testing.
     • answer:    A detailed model answer. Include: key points to mention, concrete 
                  examples, common pitfalls to avoid, and how to structure the response.

4. BEHAVIORAL QUESTIONS (minimum 5, maximum 10)
   - Based on the company culture signals in the job description.
   - Cover: teamwork, conflict resolution, leadership, failure & learning, ownership.
   - Each answer must follow the STAR method (Situation, Task, Action, Result) and 
     give a worked example the candidate can adapt.

5. SKILL GAPS
   - List skills explicitly required by the job description that the candidate lacks or 
     where evidence is weak.
   - severity = "high" if the skill is in the job title or listed as required.
   - severity = "medium" if listed as preferred or mentioned multiple times.
   - severity = "low" if mentioned once or as a nice-to-have.
   - If there are no significant gaps, return an empty array — do NOT invent gaps.

6. PREPARATION PLAN (7–14 days)
   - Build a realistic, day-by-day plan to close the skill gaps and prepare for the interview.
   - day: integer only (1, 2, 3 …) — NEVER "Day 1" or "First Day".
   - Each day must have: a clear focus topic and 3–5 specific, actionable tasks 
     (e.g. "Complete LeetCode problems 1–10 on arrays", "Watch system design video on 
     YouTube: Gaurav Sen", "Build a small React app with useContext").

OUTPUT RULES — strictly follow these:
- Return ONLY valid JSON matching the schema.
- Do NOT add markdown, code fences, comments, or any text outside the JSON.
- Do NOT use generic filler questions. Every question must be specific to this role.
- The "day" field MUST be an integer. Never a string.
`;

  const response = await callGeminiWithFallback({
    schema: interviewReportSchema,
    prompt,
  });

  let parsed = JSON.parse(response.text);

  // Normalize — handle cases where Gemini returns strings instead of objects
  parsed.technicalQuestions = (parsed.technicalQuestions || [])
    .map(
      toQuestion(
        "Technical Assessment",
        "Provide a structured answer with real examples.",
      ),
    )
    .map(parseIfString);

  parsed.behavioralQuestions = (parsed.behavioralQuestions || [])
    .map(
      toQuestion(
        "Behavioral Assessment",
        "Use the STAR method: Situation, Task, Action, Result.",
      ),
    )
    .map(parseIfString);

  parsed.skillGaps = (parsed.skillGaps || [])
    .map((item) => {
      if (typeof item === "string") {
        const m = item.match(
          /skill:\s*(.*?),\s*severity:\s*(low|medium|high)/i,
        );
        return {
          skill: m ? m[1].trim() : item,
          severity: m ? m[2].toLowerCase() : "medium",
        };
      }
      return item;
    })
    .map(parseIfString);

  parsed.preparationPlan = (parsed.preparationPlan || [])
    .map((item) => {
      if (typeof item === "string") {
        const dayM = item.match(/day:\s*(\d+)/i);
        const focusM = item.match(/focus:\s*([^,]+)/i);
        const tasksM = item.match(/tasks:\s*\[(.*)\]/i);
        return {
          day: dayM ? Number(dayM[1]) : 1,
          focus: focusM ? focusM[1].trim() : "",
          tasks: tasksM
            ? tasksM[1]
                .split(",")
                .map((t) => t.replace(/"/g, "").trim())
                .filter(Boolean)
            : [],
        };
      }
      return item;
    })
    .map(parseIfString);

  return interviewReportSchema.parse(parsed);
}

// ── generatePdfFromHtml ───────────────────────────────────────────────────────
async function generatePdfFromHtml(htmlContent) {
  console.log("[Puppeteer] Launching Chrome...");

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  console.log("[Puppeteer] Chrome launched");

  let page;
  try {
    page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "18mm", left: "14mm", right: "14mm" },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
    console.log("[Puppeteer] Chrome closed");
  }
}

// ── generateResumePdf ─────────────────────────────────────────────────────────
async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const prompt = `
You are an expert ATS resume writer and professional career consultant.

Using the candidate information below, generate a complete, polished, 
recruiter-ready HTML resume tailored to the target job.

═══════════════════════════════════
CANDIDATE RESUME / BACKGROUND:
${resume || "(No resume provided)"}

SELF DESCRIPTION:
${selfDescription || "(No self-description provided)"}

TARGET JOB DESCRIPTION:
${jobDescription}
═══════════════════════════════════

RESUME REQUIREMENTS:

1. Structure — use these sections in this order:
   ① Header (Name, Email, Phone, Location, LinkedIn, GitHub)
   ② Professional Summary (3–4 strong sentences tailored to the job)
   ③ Technical Skills (categorized — Languages, Frameworks, Databases, Tools)
   ④ Work Experience (reverse chronological, bullet points with impact metrics)
   ⑤ Projects (3–4 projects with tech stack and outcomes)
   ⑥ Education
   ⑦ Achievements & Certifications

2. ATS optimization:
   - Mirror keywords and phrases from the job description naturally.
   - Use standard section headings (not creative names like "My Journey").
   - No tables, columns, text boxes, images, or icons in the layout.
   - Clean semantic HTML only.

3. Writing quality:
   - Start every bullet point with a strong action verb.
   - Quantify achievements wherever possible (e.g. "Reduced load time by 40%").
   - Write in the third person implied style (no "I" statements).
   - Sound like a human wrote it, not an AI template.

4. HTML/CSS requirements:
   - Self-contained single HTML file with all CSS inlined in <style> tags in <head>.
   - White background (#ffffff), professional dark text (#1a1a1a).
   - Clean, modern typography — use system fonts or Google Fonts via @import.
   - Responsive to A4 page width.
   - The HTML MUST start with: <!DOCTYPE html><html><head>
   - The HTML MUST end with: </body></html>

OUTPUT FORMAT — strictly follow:
- Return ONLY one JSON object: { "html": "..." }
- The "html" value must be the complete HTML string.
- Do NOT escape the HTML inside the JSON string beyond what JSON requires.
- Do NOT include markdown, code fences, or any text outside the JSON.
- The response must be directly parsable by JSON.parse().
`;

  let response;
  try {
    // resumePdfSchema is defined locally and used correctly here
    response = await callGeminiWithFallback({
      schema: resumePdfSchema,
      prompt,
      timeoutMs: 90000,
    });
  } catch (aiErr) {
    console.error("[Resume PDF] AI generation failed:", aiErr.message);

    // Fallback: generate a basic resume from raw data
    const fallbackHtml = buildFallbackResume({
      resume,
      selfDescription,
      jobDescription,
    });
    return generatePdfFromHtml(fallbackHtml);
  }

  let jsonContent;
  try {
    jsonContent = JSON.parse(response.text);
  } catch (parseErr) {
    console.error("[Resume PDF] JSON parse failed — using fallback");
    return generatePdfFromHtml(
      buildFallbackResume({ resume, selfDescription, jobDescription }),
    );
  }

  if (!jsonContent?.html) {
    console.error("[Resume PDF] No HTML in response — using fallback");
    return generatePdfFromHtml(
      buildFallbackResume({ resume, selfDescription, jobDescription }),
    );
  }

  console.log("[Resume PDF] Generating PDF from AI HTML...");
  return generatePdfFromHtml(jsonContent.html);
}

// ── Fallback resume (plain, readable, never crashes) ─────────────────────────
function buildFallbackResume({ resume, selfDescription, jobDescription }) {
  const escape = (str) =>
    String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
    h1   { font-size: 1.8rem; margin-bottom: 4px; }
    h2   { font-size: 1.1rem; border-bottom: 2px solid #333; padding-bottom: 4px; margin-top: 28px; }
    p    { line-height: 1.7; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>Resume</h1>

  ${
    selfDescription
      ? `
  <h2>Professional Summary</h2>
  <p>${escape(selfDescription)}</p>
  `
      : ""
  }

  ${
    resume
      ? `
  <h2>Experience &amp; Background</h2>
  <p>${escape(resume)}</p>
  `
      : ""
  }

  <h2>Target Role</h2>
  <p>${escape(jobDescription)}</p>
</body>
</html>`;
}

module.exports = { generateInterviewReport, generateResumePdf };
