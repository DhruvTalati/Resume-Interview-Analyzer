const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controllers/interview.controller");
const uploads = require("../middlewares/file.middleware");

const interviewRouter = express.Router();

/**
 * @route POST /api/interview/
 * @description Generate new  interview report based on the candidate's resume and job description
 * @access  private
 */
interviewRouter.post(
  "/",
  authMiddleware.authUser,
  uploads.single("resume"),
  interviewController.generateInterviewReportController,
);

/**
 * @route GET /api/interview/report:interviewId
 * @description Get interview report by interviewId.
 * @access  private
 */
interviewRouter.get(
  "/report/:interviewId",
  authMiddleware.authUser,
  interviewController.getInterviewReportByIdController,
);

/**
 * @route GET /api/interview/
 * @description Get interview reports of logged in user.
 * @access  private
 */
interviewRouter.get(
  "/report/:interviewId",
  authMiddleware.authUser,
  interviewController.getAllInterviewReportsController,
);

module.exports = interviewRouter;
