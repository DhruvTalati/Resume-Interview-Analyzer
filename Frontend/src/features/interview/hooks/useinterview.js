import {
  getAllInterviewReports,
  generateInterviewReport,
  getInterviewReportById,
} from "../services/interview.api";

import { useContext } from "react";
import { interviewContext } from "../interview.context";

export const useInterview = () => {
  const context = useContext(interviewContext);

  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }

  const { loading, setLoading, report, reports, setReport, setReports } =
    context;

  // Generate Interview Report
  const generateReport = async ({
    jobDescription,
    selfDescription,
    resumeFile,
  }) => {
    setLoading(true);

    try {
      const response = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile,
      });

      setReport(response.interviewReport);

      return response.interviewReport;
    } catch (error) {
      console.error("Generate Report Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get Single Report
  const getReportById = async (interviewId) => {
    setLoading(true);

    try {
      const response = await getInterviewReportById(interviewId);

      setReport(response.interviewReport);

      return response.interviewReport;
    } catch (error) {
      console.error("Get Report Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get All Reports
  const getReports = async () => {
    setLoading(true);

    try {
      const response = await getAllInterviewReports();

      setReports(response.interviewReports);

      return response.interviewReports;
    } catch (error) {
      console.error("Get Reports Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    loading,
    report,
    reports,

    // Actions
    generateReport,
    getReportById,
    getReports,
  };
};
