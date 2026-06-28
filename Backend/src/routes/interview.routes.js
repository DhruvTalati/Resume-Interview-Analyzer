const express = require("express");
const { authUser } = require("../middlewares/auth.middleware");
const { upload, handleMulterError } = require("../middlewares/file.middleware");
const interviewController = require("../controllers/interview.controller");

const interviewRouter = express.Router();

/**
 * @route   POST /api/interview/
 * @desc    Generate interview report (resume PDF + job description)
 * @access  Private
 */
interviewRouter.post(
  "/",
  authUser,
  upload.single("resume"),
  handleMulterError,
  interviewController.generateInterViewReportController,
);

/**
 * @route   GET /api/interview/
 * @desc    Get all reports for logged-in user (paginated)
 * @access  Private
 * @query   ?page=1&limit=20
 */
interviewRouter.get(
  "/",
  authUser,
  interviewController.getAllInterviewReportsController,
);

/**
 * @route   GET /api/interview/report/:interviewId
 * @desc    Get a single report by ID
 * @access  Private
 */
interviewRouter.get(
  "/report/:interviewId",
  authUser,
  interviewController.getInterviewReportByIdController,
);

/**
 * @route   POST /api/interview/resume/pdf/:interviewReportId
 * @desc    Generate and download ATS resume PDF
 * @access  Private
 */
interviewRouter.post(
  "/resume/pdf/:interviewReportId",
  authUser,
  interviewController.generateResumePdfController,
);

/**
 * @route   DELETE /api/interview/:interviewId
 * @desc    Delete a report
 * @access  Private
 */
interviewRouter.delete(
  "/:interviewId",
  authUser,
  interviewController.deleteInterviewReportController,
);

module.exports = interviewRouter;
