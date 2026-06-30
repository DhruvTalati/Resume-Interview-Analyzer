const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

// ── Model fallback chain ──────────────────────────────────────────────────────
const MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"];

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

        if (err.status === 429 && err.message?.includes("limit: 0")) {
          console.log(
            `[Gemini] Quota exhausted for ${model} — switching model`,
          );
          break;
        }

        if (err.status === 503 || err.status === 429) {
          if (attempt === 2) break;

          let delay = (attempt + 1) * 8000;
          const retryMatch = err.message?.match(/retry in ([\d.]+)s/i);
          if (retryMatch) delay = Math.ceil(parseFloat(retryMatch[1])) * 1000;

          console.log(`[Gemini] Retrying in ${delay / 1000}s...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        throw err;
      }
    }
  }

  throw (
    lastError ||
    new Error("All Gemini models exhausted. Please try again later.")
  );
}

// ── Bulletproof normalization helpers ─────────────────────────────────────────
// Gemini can return ANY shape inside an array, even with responseSchema set:
// strings, numbers, booleans, null, partially-formed objects, JSON-as-string.
// Every normalizer below filters out garbage instead of crashing on it.

const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

// Attempt to parse a string as JSON; otherwise return it unchanged
const tryParseJson = (v) => {
  if (typeof v !== "string") return v;
  try {
    const parsed = JSON.parse(v);
    return parsed;
  } catch {
    return v;
  }
};

// Normalize an array of "question" items (technical/behavioral).
// Drops any item that isn't a usable object or convertible string.
function normalizeQuestions(arr, defaultIntention, defaultAnswer) {
  if (!Array.isArray(arr)) return [];

  return arr
    .map(tryParseJson)
    .map((item) => {
      if (isPlainObject(item)) {
        // Coerce all fields to strings defensively — Gemini sometimes
        // nests objects or numbers inside fields too
        return {
          question: typeof item.question === "string" ? item.question : null,
          intention:
            typeof item.intention === "string"
              ? item.intention
              : defaultIntention,
          answer: typeof item.answer === "string" ? item.answer : defaultAnswer,
        };
      }
      if (typeof item === "string" && item.trim().length > 5) {
        return {
          question: item.trim(),
          intention: defaultIntention,
          answer: defaultAnswer,
        };
      }
      return null; // numbers, booleans, null, empty strings, malformed objects
    })
    .filter((item) => item && item.question); // drop anything without a real question
}

// Normalize skill gaps array
function normalizeSkillGaps(arr) {
  if (!Array.isArray(arr)) return [];

  return arr
    .map(tryParseJson)
    .map((item) => {
      if (isPlainObject(item)) {
        const skill = typeof item.skill === "string" ? item.skill.trim() : null;
        const severity = ["low", "medium", "high"].includes(item.severity)
          ? item.severity
          : "medium";
        return skill ? { skill, severity } : null;
      }
      if (typeof item === "string") {
        const m = item.match(
          /skill:\s*(.*?),\s*severity:\s*(low|medium|high)/i,
        );
        if (m) return { skill: m[1].trim(), severity: m[2].toLowerCase() };
        if (item.trim().length > 1)
          return { skill: item.trim(), severity: "medium" };
      }
      return null;
    })
    .filter(Boolean);
}

// Normalize preparation plan array — this is the one that crashed.
// Any item that isn't a valid {day, focus, tasks} object is dropped entirely.
function normalizePreparationPlan(arr) {
  if (!Array.isArray(arr)) return [];

  const validItems = arr
    .map(tryParseJson)
    .map((item) => {
      // Reject anything that isn't a plain object outright —
      // this is exactly what crashed before: a bare number in the array
      if (!isPlainObject(item)) {
        if (typeof item === "string") {
          const dayM = item.match(/day:\s*(\d+)/i);
          const focusM = item.match(/focus:\s*([^,]+)/i);
          const tasksM = item.match(/tasks:\s*\[(.*)\]/i);
          if (!dayM) return null; // can't recover without a day number
          return {
            day: Number(dayM[1]),
            focus: focusM ? focusM[1].trim() : "General preparation",
            tasks: tasksM
              ? tasksM[1]
                  .split(",")
                  .map((t) => t.replace(/"/g, "").trim())
                  .filter(Boolean)
              : [],
          };
        }
        return null; // numbers, booleans, null, arrays — silently dropped
      }

      // It's an object — validate and coerce each field individually
      const day = Number.isInteger(item.day)
        ? item.day
        : typeof item.day === "string" && /^\d+$/.test(item.day)
          ? Number(item.day)
          : null;

      if (!day || day < 1) return null; // no recoverable day number — drop this item

      const focus =
        typeof item.focus === "string" && item.focus.trim()
          ? item.focus.trim()
          : "General preparation";

      const tasks = Array.isArray(item.tasks)
        ? item.tasks
            .filter((t) => typeof t === "string" && t.trim())
            .map((t) => t.trim())
        : typeof item.tasks === "string"
          ? [item.tasks.trim()]
          : [];

      return {
        day,
        focus,
        tasks: tasks.length ? tasks : ["Review and practice key concepts."],
      };
    })
    .filter(Boolean);

  // Re-number days sequentially in case some were dropped, so the plan
  // still reads as "Day 1, Day 2, Day 3..." instead of having gaps
  return validItems
    .sort((a, b) => a.day - b.day)
    .map((item, idx) => ({ ...item, day: idx + 1 }));
}

// ── generateInterviewReport (public) ──────────────────────────────────────────
async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const MAX_OUTER_ATTEMPTS = 2;
  let lastError;

  for (
    let outerAttempt = 1;
    outerAttempt <= MAX_OUTER_ATTEMPTS;
    outerAttempt++
  ) {
    try {
      return await generateInterviewReportOnce({
        resume,
        selfDescription,
        jobDescription,
      });
    } catch (err) {
      lastError = err;
      console.warn(
        `[AI] Outer attempt ${outerAttempt}/${MAX_OUTER_ATTEMPTS} failed: ${err.message}`,
      );
      if (outerAttempt < MAX_OUTER_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  throw lastError;
}

// ── generateInterviewReportOnce (internal) ────────────────────────────────────
async function generateInterviewReportOnce({
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

2. MATCH SCORE (0–100)
   - Compare the candidate's skills, experience, and background against the job requirements.
   - 90–100: near-perfect fit  |  70–89: strong fit  |  50–69: moderate fit  |  <50: weak fit

3. TECHNICAL QUESTIONS (minimum 8, maximum 15)
   - Tailor every question to the SPECIFIC technologies and skills in this job description.
   - Each item MUST be an object with exactly these three string fields: question, intention, answer.
   - This array MUST NOT be empty.

4. BEHAVIORAL QUESTIONS (minimum 5, maximum 10)
   - Each item MUST be an object with exactly these three string fields: question, intention, answer.
   - Use the STAR method in every answer.
   - This array MUST NOT be empty.

5. SKILL GAPS
   - Each item MUST be an object with exactly: skill (string), severity ("low"|"medium"|"high").
   - If there are genuinely no gaps, return an empty array.

6. PREPARATION PLAN (7–14 days)
   - Each item MUST be an object with exactly: day (integer, NOT a string), focus (string), 
     tasks (array of strings).
   - day starts at 1 and increases sequentially. NEVER "Day 1" as a string — just the number 1.
   - This array MUST NOT be empty.

CRITICAL FORMAT RULE — read this twice:
Every single item inside technicalQuestions, behavioralQuestions, skillGaps, and 
preparationPlan MUST be a JSON OBJECT with the exact fields specified above. 
NEVER put a raw string, number, or boolean directly inside these arrays. 
Every array element is always { ... } — never a bare value.

OUTPUT RULES:
- Return ONLY valid JSON matching the schema.
- Do NOT add markdown, code fences, comments, or any text outside the JSON.
- Do NOT use generic filler questions. Every question must be specific to this role.
`;

  const response = await callGeminiWithFallback({
    schema: interviewReportSchema,
    prompt,
  });

  let parsed = JSON.parse(response.text);

  // ── Bulletproof normalization — drops malformed items instead of crashing ──
  parsed.technicalQuestions = normalizeQuestions(
    parsed.technicalQuestions,
    "Technical Assessment",
    "Provide a structured answer with real examples.",
  );

  parsed.behavioralQuestions = normalizeQuestions(
    parsed.behavioralQuestions,
    "Behavioral Assessment",
    "Use the STAR method: Situation, Task, Action, Result.",
  );

  parsed.skillGaps = normalizeSkillGaps(parsed.skillGaps);

  parsed.preparationPlan = normalizePreparationPlan(parsed.preparationPlan);

  // Defensive defaults for top-level fields
  if (
    typeof parsed.matchScore !== "number" ||
    Number.isNaN(parsed.matchScore)
  ) {
    console.warn(
      "[AI] matchScore missing from Gemini response — defaulting to 50",
    );
    parsed.matchScore = 50;
  }
  parsed.matchScore = Math.min(100, Math.max(0, Math.round(parsed.matchScore)));

  if (
    !parsed.title ||
    typeof parsed.title !== "string" ||
    !parsed.title.trim()
  ) {
    parsed.title = "Interview Report";
  }

  // Only reject as hollow if EVERYTHING is empty after normalization —
  // a partially malformed response (like the preparationPlan[1] number bug)
  // now survives because the bad item was filtered out, not the whole request
  const isHollow =
    parsed.technicalQuestions.length === 0 &&
    parsed.behavioralQuestions.length === 0 &&
    parsed.preparationPlan.length === 0;

  if (isHollow) {
    throw new Error(
      "Gemini returned an empty report (no questions or plan). Retrying.",
    );
  }

  // If preparationPlan is empty but other sections aren't, inject one
  // minimal fallback day rather than failing the whole report
  if (parsed.preparationPlan.length === 0) {
    parsed.preparationPlan = [
      {
        day: 1,
        focus: "General interview preparation",
        tasks: [
          "Review the job description and align your experience to it.",
          "Practice the technical and behavioral questions above.",
        ],
      },
    ];
  }

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
    response = await callGeminiWithFallback({
      schema: resumePdfSchema,
      prompt,
      timeoutMs: 90000,
    });
  } catch (aiErr) {
    console.error("[Resume PDF] AI generation failed:", aiErr.message);
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

  if (
    !jsonContent?.html ||
    typeof jsonContent.html !== "string" ||
    jsonContent.html.trim().length < 50
  ) {
    console.error("[Resume PDF] No usable HTML in response — using fallback");
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
