const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

const MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"];

// ── Zod schemas (for final validation only — NOT passed to Gemini) ──
const interviewReportSchema = z.object({
  title: z.string(),
  matchScore: z.number().min(0).max(100),
  technicalQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string(),
    }),
  ),
  behavioralQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string(),
    }),
  ),
  skillGaps: z.array(
    z.object({
      skill: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    }),
  ),
  preparationPlan: z.array(
    z.object({
      day: z.number().int().positive(),
      focus: z.string(),
      tasks: z.array(z.string()),
    }),
  ),
});

const resumePdfSchema = z.object({ html: z.string() });

// ── Raw JSON schema passed to Gemini
const INTERVIEW_REPORT_GEMINI_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description:
        "The exact job title extracted from the job description. Example: 'Senior Frontend Engineer'",
    },
    matchScore: {
      type: "number",
      description:
        "Integer 0–100 representing how well the candidate matches the role. Example: 72",
    },
    technicalQuestions: {
      type: "array",
      description:
        "Array of 10–15 technical interview questions tailored to the role and candidate",
      items: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description:
              "The full interview question text. Example: 'How would you implement a debounce function in JavaScript and when would you use it in a React application?'",
          },
          intention: {
            type: "string",
            description:
              "2-3 sentences explaining what this specific question assesses and why interviewers ask it. Example: 'This tests the candidate's understanding of performance optimization in async scenarios. It reveals whether they understand event loop mechanics and can apply debouncing to real UI problems like search inputs or window resize handlers.'",
          },
          answer: {
            type: "string",
            description:
              "Detailed 5-8 sentence model answer covering the concept, a code example, best practices, and trade-offs. Example: 'A debounce function delays invoking a function until after a specified wait time has passed since the last call. Here is a basic implementation: function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }. In React, you would typically use useCallback to memoize the debounced function and useEffect to clean it up on unmount. Common use cases include search input handlers, window resize listeners, and API rate limiting. The key trade-off versus throttle is that debounce waits for a pause in events while throttle fires at a fixed interval. Libraries like Lodash provide battle-tested implementations worth using in production.'",
          },
        },
        required: ["question", "intention", "answer"],
      },
    },
    behavioralQuestions: {
      type: "array",
      description:
        "Array of 5–8 behavioral interview questions using STAR method",
      items: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description:
              "The behavioral question. Example: 'Tell me about a time you had to debug a critical production issue under time pressure.'",
          },
          intention: {
            type: "string",
            description:
              "2-3 sentences on what this question assesses. Example: 'This evaluates the candidate's problem-solving composure under pressure and their systematic debugging approach. It also reveals communication skills when coordinating with stakeholders during an incident.'",
          },
          answer: {
            type: "string",
            description:
              "Detailed STAR-method answer. Situation, Task, Action (specific steps), Result (measurable). 5-7 sentences minimum. Example: 'Situation: During a peak traffic event at my previous role, our payment service started returning 500 errors affecting 30% of checkouts. Task: As the on-call engineer I had to identify and fix the root cause within our 15-minute SLA. Action: I immediately checked Datadog dashboards, identified a spike in DB connection timeouts, traced it to a missing index on the orders table added during a recent migration, and deployed a hotfix after testing locally. I kept the team updated via Slack every 5 minutes and drafted a customer-facing status update. Result: The issue was resolved in 11 minutes, we recovered 100% of affected transactions via retry logic, and I wrote a post-mortem that led to adding DB migration checks to our CI pipeline.'",
          },
        },
        required: ["question", "intention", "answer"],
      },
    },
    skillGaps: {
      type: "array",
      description:
        "Real gaps between candidate profile and job requirements. Empty array if no gaps.",
      items: {
        type: "object",
        properties: {
          skill: {
            type: "string",
            description:
              "The specific skill or technology that is missing or weak. Example: 'Kubernetes cluster management' or 'System design at scale'",
          },
          severity: {
            type: "string",
            enum: ["low", "medium", "high"],
            description:
              "How critical this gap is. high=must-have for the role, medium=important, low=nice-to-have",
          },
        },
        required: ["skill", "severity"],
      },
    },
    preparationPlan: {
      type: "array",
      description:
        "A 7–10 day personalized preparation plan. Must have exactly 7 to 10 items.",
      items: {
        type: "object",
        properties: {
          day: {
            type: "integer",
            description:
              "Day number as an integer starting from 1. Example: 1, 2, 3 — NOT 'Day 1', NOT 'day one'",
          },
          focus: {
            type: "string",
            description:
              "The specific topic or theme for this day. Example: 'Docker containerization and multi-stage builds'",
          },
          tasks: {
            type: "array",
            description: "3–5 specific, actionable tasks for this day",
            items: {
              type: "string",
              description:
                "One actionable task. Example: 'Write a Dockerfile for a Node.js app with a multi-stage build to minimize image size'",
            },
          },
        },
        required: ["day", "focus", "tasks"],
      },
    },
  },
  required: [
    "title",
    "matchScore",
    "technicalQuestions",
    "behavioralQuestions",
    "skillGaps",
    "preparationPlan",
  ],
};

const RESUME_PDF_GEMINI_SCHEMA = {
  type: "object",
  properties: {
    html: {
      type: "string",
      description:
        "Complete self-contained HTML document string for the resume. Must start with <!DOCTYPE html>",
    },
  },
  required: ["html"],
};

// ── Gemini caller ────────────────────────────
async function callGeminiWithFallback({
  geminiSchema,
  prompt,
  timeoutMs = 90000,
}) {
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
              responseSchema: geminiSchema,
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

// ── HTML stripper ──────────────────────────
function stripHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Placeholder detector ─────────────────────────────────────────
const PLACEHOLDER_VALUES = new Set([
  "question",
  "answer",
  "intention",
  "skill",
  "severity",
  "title",
  "matchscore",
  "matchScore",
  "technical assessment",
  "behavioral assessment",
  "provide a structured answer with real examples.",
  "use the star method: situation, task, action, result.",
]);

function isPlaceholder(str) {
  if (typeof str !== "string") return false;
  return PLACEHOLDER_VALUES.has(str.toLowerCase().trim());
}

// ── Normalizers ────────────────────────────────
const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const tryParseJson = (v) => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};

function normalizeQuestions(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(tryParseJson)
    .map((item) => {
      if (!isPlainObject(item)) return null;
      const question =
        typeof item.question === "string" ? stripHtml(item.question) : null;
      const intention =
        typeof item.intention === "string" ? stripHtml(item.intention) : null;
      const answer =
        typeof item.answer === "string" ? stripHtml(item.answer) : null;
      // Drop items where Gemini returned field names as values
      if (!question || isPlaceholder(question)) return null;
      if (!intention || isPlaceholder(intention)) return null;
      if (!answer || isPlaceholder(answer)) return null;
      return { question, intention, answer };
    })
    .filter(Boolean);
}

function normalizeSkillGaps(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(tryParseJson)
    .map((item) => {
      if (!isPlainObject(item)) return null;
      const skill =
        typeof item.skill === "string" ? stripHtml(item.skill) : null;
      const severity = ["low", "medium", "high"].includes(item.severity)
        ? item.severity
        : null;
      // Drop placeholder values
      if (!skill || isPlaceholder(skill)) return null;
      if (!severity || isPlaceholder(String(item.severity))) return null;
      return { skill, severity };
    })
    .filter(Boolean);
}

function normalizePreparationPlan(arr) {
  if (!Array.isArray(arr)) return [];

  const valid = arr
    .map(tryParseJson)
    .map((item) => {
      if (!isPlainObject(item)) return null;

      // Handle:
      // 1
      // "1"
      // 1.0
      // "Day 1"
      // "Day 1: React"

      let day = null;
      const rawDay = item.day;

      if (Number.isInteger(rawDay)) {
        day = rawDay;
      } else if (typeof rawDay === "number" && !isNaN(rawDay)) {
        day = Math.round(rawDay);
      } else if (typeof rawDay === "string") {
        const trimmed = rawDay.trim();

        if (/^\d+$/.test(trimmed)) {
          day = Number(trimmed);
        } else {
          const match = trimmed.match(/day\s*(\d+)/i);

          if (match) day = Number(match[1]);
        }
      }

      if (!day || day < 1) return null;

      const focus =
        typeof item.focus === "string" && item.focus.trim()
          ? stripHtml(item.focus)
          : null;

      if (!focus) return null;

      let tasks = [];

      if (Array.isArray(item.tasks)) {
        tasks = item.tasks
          .filter((t) => typeof t === "string" && t.trim().length > 2)
          .map((t) => stripHtml(t));
      } else if (isPlainObject(item.tasks)) {
        tasks = Object.values(item.tasks)
          .filter((t) => typeof t === "string" && t.trim().length > 2)
          .map((t) => stripHtml(t));
      } else if (typeof item.tasks === "string" && item.tasks.trim()) {
        tasks = item.tasks
          .split(",")
          .map((t) => stripHtml(t.trim()))
          .filter(Boolean);
      }

      return {
        day,
        focus,
        tasks: tasks.length > 0 ? tasks : ["Review and practice this topic."],
      };
    })
    .filter(Boolean);

  return valid
    .sort((a, b) => a.day - b.day)
    .map((item, index) => ({
      ...item,
      day: index + 1,
    }));
}

// ── Fallback days for roadmap ───────────────────────────
const FALLBACK_DAYS = [
  {
    focus: "Deep-dive into the company and role",
    tasks: [
      "Research the company's products, engineering blog, and recent news",
      "Highlight every technical keyword from the job description",
      "Map each requirement to your existing experience",
      "Prepare a 90-second elevator pitch tailored to this role",
    ],
  },
  {
    focus: "Core data structures and algorithms",
    tasks: [
      "Review arrays, hash maps, trees, and graphs",
      "Solve 5 LeetCode Medium problems in the language required",
      "Practice time and space complexity analysis",
      "Study common patterns: sliding window, two pointers, BFS/DFS",
    ],
  },
  {
    focus: "Primary technology stack deep-dive",
    tasks: [
      "Review the main framework or language from the job description",
      "Build a small project or feature using the required stack",
      "Study official documentation for any unfamiliar APIs",
      "Read about common pitfalls and best practices",
    ],
  },
  {
    focus: "System design fundamentals",
    tasks: [
      "Study load balancing, caching strategies, and CDN basics",
      "Practice designing a URL shortener or chat application",
      "Review SQL vs NoSQL trade-offs and when to use each",
      "Study CAP theorem and distributed system concepts",
    ],
  },
  {
    focus: "Behavioral and soft skills preparation",
    tasks: [
      "Write out 6 STAR stories covering leadership, conflict, failure, and success",
      "Practice answering 'Tell me about yourself' and 'Why this company?'",
      "Prepare 5 thoughtful questions to ask the interviewer",
      "Record yourself answering questions and review for clarity",
    ],
  },
  {
    focus: "Mock technical interview simulation",
    tasks: [
      "Do a full 45-minute mock coding interview on Pramp or with a friend",
      "Time yourself solving 2 medium-difficulty problems",
      "Practice explaining your thought process out loud while coding",
      "Review any mistakes and study those specific topics",
    ],
  },
  {
    focus: "Weak areas and final review",
    tasks: [
      "Re-study any topics you struggled with during the week",
      "Light review of all key technical concepts — no cramming",
      "Re-read the job description and your resume one final time",
      "Prepare your setup (reliable internet, quiet space, test your camera/mic)",
    ],
  },
];

// ── generateInterviewReport ─────────────────────────────
async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const MAX_ATTEMPTS = 2;
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await generateInterviewReportOnce({
        resume,
        selfDescription,
        jobDescription,
      });
    } catch (err) {
      lastError = err;
      console.warn(
        `[AI] Attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err.message}`,
      );
      if (attempt < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw lastError;
}

async function generateInterviewReportOnce({
  resume,
  selfDescription,
  jobDescription,
}) {
  // ── Prompt ──────
  const prompt = `
You are a senior technical interviewer and career coach at a top tech company (Google, Amazon, Microsoft level).
Your task is to generate a complete, personalized interview preparation report.

CANDIDATE RESUME:
${resume || "(No resume provided)"}

CANDIDATE SELF-DESCRIPTION:
${selfDescription || "(No self-description provided)"}

TARGET JOB DESCRIPTION:
${jobDescription}

════════════════════════════════════════════════════════════
CRITICAL RULES — VIOLATION WILL CAUSE REJECTION:
════════════════════════════════════════════════════════════

RULE 1 — NO PLACEHOLDER VALUES
NEVER output the literal words "question", "answer", "intention", "skill", "severity", 
"focus", "tasks" as the VALUE of a field. These are field NAMES, not content.
WRONG: { "question": "question", "answer": "answer" }
RIGHT: { "question": "Explain how React's virtual DOM diffing algorithm works and why it improves performance.", "answer": "React's virtual DOM is a lightweight JavaScript representation of the actual DOM..." }

RULE 2 — EVERY QUESTION MUST BE SPECIFIC
Every question must reference the SPECIFIC job requirements, technologies, or the 
candidate's actual background. Generic questions like "Tell me about yourself" with no 
connection to the role are NOT acceptable.

RULE 3 — EVERY ANSWER MUST BE DETAILED
Each "answer" field must be a complete, expert-level response of at least 5 sentences.
Include: the core concept, a concrete code example or real scenario, best practices, 
and how it applies to this specific role.

RULE 4 — EVERY INTENTION MUST BE SPECIFIC
Each "intention" field must explain specifically what THIS question assesses for THIS role.
Never use generic phrases as the full intention.

RULE 5 — PREPARATION PLAN (MANDATORY)

The preparationPlan array MUST contain EXACTLY 7 objects.

Each object MUST follow this structure:

{
  "day": 1,
  "focus": "Specific learning topic",
  "tasks": [
    "Task 1",
    "Task 2",
    "Task 3"
  ]
}

STRICT REQUIREMENTS:

- The "day" field MUST be an INTEGER only.
- Valid values are: 1,2,3,4,5,6,7
- NEVER return:
  "Day 1"
  "day 1"
  "DAY 1"
  "Week 1"
  "First Day"

- Every day MUST contain:
  • one unique focus
  • 3 to 5 practical tasks

- Tasks must be complete sentences describing real interview preparation work.

- Never leave focus or tasks empty.

- Never use placeholder values such as:
  "focus"
  "task"
  "tasks"

The preparation plan must be personalized using BOTH the candidate's resume and the target job description.

RULE 6 — SKILL GAPS MUST BE REAL
Only list actual gaps between the candidate's profile and the job requirements.
The "skill" field must be the specific skill name (e.g. "Kubernetes", "System Design at Scale").
The "severity" field must be exactly one of: "low", "medium", or "high".

════════════════════════════════════════════════════════════
QUALITY BENCHMARK — aim for this level:
════════════════════════════════════════════════════════════

Example of an ACCEPTABLE technical question entry:
{
  "question": "The job description mentions Kubernetes. Walk me through how you would set up a Horizontal Pod Autoscaler for a Node.js microservice that experiences traffic spikes during business hours. What metrics would you use and why?",
  "intention": "This question tests practical Kubernetes operational knowledge beyond just running containers. Interviewers at this company use HPA extensively and want to know if you understand resource metrics, custom metrics via Prometheus, and can tune autoscaling to avoid cold-start latency during traffic ramps.",
  "answer": "A Horizontal Pod Autoscaler in Kubernetes automatically scales the number of pod replicas based on observed metrics. For a Node.js service with business-hour traffic patterns, I would start with CPU and memory as base metrics using kubectl autoscale deployment my-service --cpu-percent=60 --min=2 --max=20. However, for more accurate scaling I would set up custom metrics via the Prometheus adapter, tracking request rate (HTTP requests per second) which better represents actual load than CPU alone for I/O-bound Node.js services. The HPA manifest would reference these custom metrics using the external or object metric type. To handle cold-start latency I would set a minimum replica count of 2 during business hours using a CronJob that patches the HPA minReplicas field, and set the scaleDown stabilizationWindowSeconds to 300 seconds to prevent thrashing. I would also configure preemptive scaling using KEDA for event-driven workloads if the traffic spikes are triggered by a message queue."
}

Example of an ACCEPTABLE behavioral question entry:
{
  "question": "Describe a situation where you had to convince your team to adopt a new technology or architectural pattern that they were initially resistant to.",
  "intention": "This question evaluates the candidate's ability to drive technical change in a collaborative environment, which is critical for a senior role where they will influence architectural decisions. It reveals their communication style, ability to build consensus, and whether they can back technical recommendations with data.",
  "answer": "Situation: At my previous company our team was using REST for all internal microservice communication, but I identified that our high-frequency inventory sync service was causing performance bottlenecks due to HTTP overhead. Task: I wanted to migrate to gRPC for internal services but the team was skeptical because it meant learning Protocol Buffers and changing our deployment pipeline. Action: Instead of pushing for immediate adoption, I spent a weekend building a proof-of-concept that compared REST versus gRPC for our specific payload sizes and request volumes. I benchmarked 3x lower latency and 40% reduced bandwidth with gRPC and presented these numbers in our next architecture review with a clear migration plan that allowed gradual rollout starting with one non-critical service. I also created a wiki guide for Protocol Buffers to lower the learning curve. Result: The team approved the migration unanimously. We rolled it out to 4 internal services over 2 sprints, reducing our inventory sync latency from 240ms to 78ms on average, which directly improved checkout performance metrics."
}

════════════════════════════════════════════════════════════
Now generate the complete report following ALL rules above.
Return ONLY valid JSON. No markdown, no code fences, no text outside the JSON.
════════════════════════════════════════════════════════════
`;

  const response = await callGeminiWithFallback({
    geminiSchema: INTERVIEW_REPORT_GEMINI_SCHEMA,
    prompt,
  });

  let parsed;
  try {
    parsed = JSON.parse(response.text);
  } catch (err) {
    throw new Error(`JSON parse failed: ${err.message}`);
  }

  // Normalize and strip placeholders
  parsed.technicalQuestions = normalizeQuestions(parsed.technicalQuestions);
  parsed.behavioralQuestions = normalizeQuestions(parsed.behavioralQuestions);
  parsed.skillGaps = normalizeSkillGaps(parsed.skillGaps);
  parsed.preparationPlan = normalizePreparationPlan(parsed.preparationPlan);

  // Validate matchScore
  if (typeof parsed.matchScore !== "number" || isNaN(parsed.matchScore))
    parsed.matchScore = 50;
  parsed.matchScore = Math.min(100, Math.max(0, Math.round(parsed.matchScore)));

  // Validate title
  if (
    !parsed.title ||
    typeof parsed.title !== "string" ||
    isPlaceholder(parsed.title)
  ) {
    parsed.title = "Interview Report";
  } else {
    parsed.title = stripHtml(parsed.title);
  }

  // If placeholder detector wiped out everything, reject and retry
  const isEmpty =
    parsed.technicalQuestions.length === 0 &&
    parsed.behavioralQuestions.length === 0 &&
    parsed.preparationPlan.length === 0;
  if (isEmpty)
    throw new Error("Gemini returned only placeholder values. Retrying.");

  // Ensure minimum 7-day roadmap
  if (parsed.preparationPlan.length < 7) {
    const existing = parsed.preparationPlan.length;
    for (let i = existing; i < 7; i++) {
      const d = FALLBACK_DAYS[i] || FALLBACK_DAYS[FALLBACK_DAYS.length - 1];
      parsed.preparationPlan.push({
        day: i + 1,
        focus: d.focus,
        tasks: d.tasks,
      });
    }
    parsed.preparationPlan = parsed.preparationPlan.map((item, idx) => ({
      ...item,
      day: idx + 1,
    }));
  }

  // Final Zod validation
  return interviewReportSchema.parse(parsed);
}

// ── generatePdfFromHtml ────────────────────
async function generatePdfFromHtml(htmlContent) {
  console.log("[Puppeteer] Launching Chrome...");
  const browser = await puppeteer.launch({
    headless: true,
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      "/opt/render/.cache/puppeteer/chrome/linux-149.0.7827.22/chrome-linux64/chrome",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
    ],
  });
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

// ── generateResumePdf ──────────────────
async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const prompt = `
You are an expert ATS resume writer. Generate a complete recruiter-ready HTML resume.

CANDIDATE INFO:
${resume || "(No resume provided)"}
${selfDescription ? `\nSELF DESCRIPTION:\n${selfDescription}` : ""}

TARGET JOB:
${jobDescription}

REQUIREMENTS:
- Sections: Header, Professional Summary, Technical Skills, Work Experience, Projects, Education, Achievements
- Mirror keywords from the job description for ATS optimization
- Use action verbs and quantified achievements
- Self-contained HTML with CSS in <style> tag
- White background, professional typography
- Must start with <!DOCTYPE html><html> and end with </body></html>

Return ONLY: { "html": "<complete html string>" }
No markdown, no code fences.
`;

  let response;
  try {
    response = await callGeminiWithFallback({
      geminiSchema: RESUME_PDF_GEMINI_SCHEMA,
      prompt,
      timeoutMs: 90000,
    });
  } catch (err) {
    console.error("[Resume PDF] AI failed:", err.message);
    return generatePdfFromHtml(
      buildFallbackResume({ resume, selfDescription, jobDescription }),
    );
  }

  let jsonContent;
  try {
    jsonContent = JSON.parse(response.text);
  } catch {
    return generatePdfFromHtml(
      buildFallbackResume({ resume, selfDescription, jobDescription }),
    );
  }

  if (
    !jsonContent?.html ||
    typeof jsonContent.html !== "string" ||
    jsonContent.html.trim().length < 100
  ) {
    return generatePdfFromHtml(
      buildFallbackResume({ resume, selfDescription, jobDescription }),
    );
  }

  return generatePdfFromHtml(jsonContent.html);
}

// ── Fallback resume ───────────────────────────────────────────────────────────
function buildFallbackResume({ resume, selfDescription, jobDescription }) {
  const esc = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<style>body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a;max-width:800px;margin:0 auto}
h1{font-size:1.8rem}h2{font-size:1.1rem;border-bottom:2px solid #333;padding-bottom:4px;margin-top:28px}
p{line-height:1.7;white-space:pre-wrap}</style></head><body>
<h1>Resume</h1>
${selfDescription ? `<h2>Professional Summary</h2><p>${esc(selfDescription)}</p>` : ""}
${resume ? `<h2>Experience</h2><p>${esc(resume)}</p>` : ""}
<h2>Target Role</h2><p>${esc(jobDescription)}</p>
</body></html>`;
}

module.exports = { generateInterviewReport, generateResumePdf };
