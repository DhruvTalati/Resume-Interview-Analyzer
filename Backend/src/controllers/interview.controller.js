const pdfParse = require("pdf-parse");
const {
  generateInterviewReport,
  generateResumePdf,
} = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

// ── Async error wrapper ───────────────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── Helper: map AI/Gemini errors to HTTP status codes ────────────────────────
const handleAiError = (error, res) => {
  console.error("[AI Error]", error.message);

  if (error.status === 429) {
    return res.status(429).json({
      success: false,
      message: "AI quota exceeded. Please wait a few minutes and try again.",
      retryAfter: 60,
    });
  }
  if (
    error.status === 503 ||
    error.message?.includes("All Gemini models exhausted")
  ) {
    return res.status(503).json({
      success: false,
      message:
        "AI service is temporarily unavailable due to high demand. Please try again shortly.",
      retryAfter: 30,
    });
  }
  if (error.message === "Gemini timeout") {
    return res.status(504).json({
      success: false,
      message:
        "AI response timed out. The service is under heavy load — please try again.",
      retryAfter: 15,
    });
  }
  return null; // caller should fall through to generic 500
};

// ── Generate Interview Report ─────────────────────────────────────────────────
/**
 * @route   POST /api/interview/
 * @access  Private
 */
const generateInterViewReportController = asyncHandler(
  async (req, res, next) => {
    console.log("[Step 1] Request received");

    let resumeText = "";

    if (req.file) {
      try {
        const parsed = await pdfParse(req.file.buffer);
        resumeText = parsed.text?.trim() || "";
        console.log("[Step 2] PDF parsed —", resumeText.length, "chars");
      } catch (parseErr) {
        return res.status(422).json({
          success: false,
          message:
            "Could not read the uploaded PDF. Please ensure it is a valid, text-based PDF.",
        });
      }
    }

    const { selfDescription, jobDescription } = req.body;

    if (!jobDescription?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job description is required.",
      });
    }
    if (!resumeText && !selfDescription?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please upload a resume or provide a self description.",
      });
    }

    console.log("[Step 3] Calling Gemini...");

    let aiReport;
    try {
      aiReport = await generateInterviewReport({
        resume: resumeText,
        selfDescription: selfDescription?.trim() || "",
        jobDescription: jobDescription.trim(),
      });
    } catch (aiErr) {
      const handled = handleAiError(aiErr, res);
      if (handled) return;
      return next(aiErr);
    }

    console.log("[Step 4] Gemini response received");
    console.log("[Step 5] Saving to MongoDB...");

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeText,
      selfDescription: selfDescription?.trim() || "",
      jobDescription: jobDescription.trim(),
      ...aiReport,
      title: aiReport?.title || "Interview Report",
    });

    console.log("[Step 6] Saved — ID:", interviewReport._id);

    res.status(201).json({
      success: true,
      message: "Interview report generated successfully.",
      interviewReport,
    });
  },
);

// ── Get Report By ID ──────────────────────────────────────────────────────────
/**
 * @route   GET /api/interview/report/:interviewId
 * @access  Private
 */
const getInterviewReportByIdController = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;

  if (!interviewId.match(/^[0-9a-fA-F]{24}$/)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid report ID." });
  }

  const interviewReport = await interviewReportModel.findOne({
    _id: interviewId,
    user: req.user.id,
  });

  if (!interviewReport) {
    return res.status(404).json({
      success: false,
      message: "Interview report not found.",
    });
  }

  res.status(200).json({
    success: true,
    message: "Interview report fetched successfully.",
    interviewReport,
  });
});

// ── Get All Reports ───────────────────────────────────────────────────────────
/**
 * @route   GET /api/interview/
 * @access  Private
 */
const getAllInterviewReportsController = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [interviewReports, total] = await Promise.all([
    interviewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(
        "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan",
      ),
    interviewReportModel.countDocuments({ user: req.user.id }),
  ]);

  res.status(200).json({
    success: true,
    message: "Interview reports fetched successfully.",
    interviewReports,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ── Generate Resume PDF ───────────────────────────────────────────────────────
/**
 * @route   POST /api/interview/resume/pdf/:interviewReportId
 * @access  Private
 */
const generateResumePdfController = asyncHandler(async (req, res, next) => {
  const { interviewReportId } = req.params;

  if (!interviewReportId.match(/^[0-9a-fA-F]{24}$/)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid report ID." });
  }

  const interviewReport = await interviewReportModel.findOne({
    _id: interviewReportId,
    user: req.user.id,
  });

  if (!interviewReport) {
    return res.status(404).json({
      success: false,
      message: "Interview report not found.",
    });
  }

  const { resume, jobDescription, selfDescription } = interviewReport;

  let pdfBuffer;
  try {
    pdfBuffer = await generateResumePdf({
      resume,
      jobDescription,
      selfDescription,
    });
  } catch (aiErr) {
    const handled = handleAiError(aiErr, res);
    if (handled) return;
    return next(aiErr);
  }

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="resume_${interviewReportId}.pdf"`,
    "Content-Length": pdfBuffer.length,
    "Cache-Control": "no-store",
  });

  res.send(pdfBuffer);
});

// ── Delete Report ─────────────────────────────────────────────────────────────
/**
 * @route   DELETE /api/interview/:interviewId
 * @access  Private
 */
const deleteInterviewReportController = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;

  if (!interviewId.match(/^[0-9a-fA-F]{24}$/)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid report ID." });
  }

  const report = await interviewReportModel.findOneAndDelete({
    _id: interviewId,
    user: req.user.id,
  });

  if (!report) {
    return res.status(404).json({
      success: false,
      message: "Report not found or already deleted.",
    });
  }

  res.status(200).json({
    success: true,
    message: "Report deleted successfully.",
  });
});

module.exports = {
  generateInterViewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
  deleteInterviewReportController,
};
