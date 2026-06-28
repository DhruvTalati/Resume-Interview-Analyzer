import { useContext, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import { InterviewContext } from "../interview.context";
import {
  generateInterviewReport,
  getInterviewReportById,
  getAllInterviewReports,
  generateResumePdf,
  deleteInterviewReport,
} from "../services/interview.api";

export const useInterview = () => {
  const context = useContext(InterviewContext);

  if (!context) {
    throw new Error("useInterview must be used within an <InterviewProvider>.");
  }

  const {
    loading,
    setLoading,
    report,
    setReport,
    reports,
    setReports,
    error,
    setError,
    clearError,
    pagination,
    setPagination,
    removeReportLocally,
  } = context;

  // useParams() is safe here — returns undefined when not inside a route with :interviewId
  const { interviewId } = useParams();

  // ── Generate Report ───────────────────────────────────────────────────────
  const generateReport = useCallback(
    async ({ jobDescription, selfDescription, resumeFile }) => {
      clearError();
      setLoading(true);
      try {
        const response = await generateInterviewReport({
          jobDescription,
          selfDescription,
          resumeFile,
        });

        if (!response?.interviewReport) {
          throw new Error("No report data returned from server.");
        }

        setReport(response.interviewReport);
        return response.interviewReport; // caller uses _id to navigate
      } catch (err) {
        setError(err.message || "Failed to generate report.");
        throw err; // re-throw so page components can show toasts
      } finally {
        setLoading(false);
      }
    },
    [clearError, setError, setLoading, setReport],
  );

  // ── Get Single Report ─────────────────────────────────────────────────────
  const getReportById = useCallback(
    async (id) => {
      clearError();
      setLoading(true);
      try {
        const response = await getInterviewReportById(id);
        if (!response?.interviewReport) {
          throw new Error("Report not found.");
        }
        setReport(response.interviewReport);
        return response.interviewReport;
      } catch (err) {
        setError(err.message || "Failed to load report.");
        // Don't re-throw — page will show error state via context
        return null;
      } finally {
        setLoading(false);
      }
    },
    [clearError, setError, setLoading, setReport],
  );

  // ── Get All Reports ───────────────────────────────────────────────────────
  const getReports = useCallback(
    async ({ page = 1, limit = 20 } = {}) => {
      clearError();
      setLoading(true);
      try {
        const response = await getAllInterviewReports({ page, limit });
        setReports(response.interviewReports || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
        return response.interviewReports || [];
      } catch (err) {
        setError(err.message || "Failed to load reports.");
        setReports([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [clearError, setError, setLoading, setReports, setPagination],
  );

  // ── Download Resume PDF ───────────────────────────────────────────────────
  // BUG IN ORIGINAL: setLoading(true) was set but the global loading flag
  // blocked the UI while waiting for Gemini (up to 90s).
  // Fixed: use a separate downloading flag — caller manages it locally,
  // and we clean up the object URL to prevent memory leaks.
  const getResumePdf = useCallback(
    async (interviewReportId) => {
      clearError();
      try {
        const blob = await generateResumePdf({ interviewReportId });

        // Validate we actually got a PDF blob
        if (!blob || blob.size === 0) {
          throw new Error("Received empty PDF response.");
        }

        const url = window.URL.createObjectURL(
          new Blob([blob], { type: "application/pdf" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `resume_${interviewReportId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove(); // clean up DOM node

        // Release the object URL after a short delay (allows download to start)
        setTimeout(() => window.URL.revokeObjectURL(url), 5000);
      } catch (err) {
        setError(err.message || "Failed to generate resume PDF.");
        throw err; // re-throw so the caller can show a toast
      }
    },
    [clearError, setError],
  );

  // ── Delete Report ─────────────────────────────────────────────────────────
  const deleteReport = useCallback(
    async (id) => {
      clearError();
      try {
        await deleteInterviewReport(id);
        removeReportLocally(id); // instant UI update — no refetch needed
        if (report?._id === id) {
          setReport(null); // clear active report if it was deleted
        }
      } catch (err) {
        setError(err.message || "Failed to delete report.");
        throw err;
      }
    },
    [clearError, setError, removeReportLocally, report, setReport],
  );

  // ── Auto-fetch on mount ───────────────────────────────────────────────────
  // On the Interview page: load the specific report
  // On any other page: load the report list
  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId);
    } else {
      getReports();
    }
  }, [interviewId]); // eslint-disable-line react-hooks/exhaustive-deps
  // getReportById/getReports are stable useCallbacks — omitting to avoid
  // infinite loops when context state changes

  return {
    // State
    loading,
    report,
    reports,
    error,
    pagination,
    // Actions
    generateReport,
    getReportById,
    getReports,
    getResumePdf,
    deleteReport,
    clearError,
  };
};
