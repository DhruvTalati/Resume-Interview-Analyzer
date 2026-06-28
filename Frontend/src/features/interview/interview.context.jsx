import { createContext, useState, useCallback, useMemo } from "react";

export const InterviewContext = createContext(null);

export const InterviewProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null); // last error message
  const [pagination, setPagination] = useState({
    // from backend pagination
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const clearError = useCallback(() => setError(null), []);

  // Remove a report from local state without a refetch
  const removeReportLocally = useCallback((id) => {
    setReports((prev) => prev.filter((r) => r._id !== id));
  }, []);

  const value = useMemo(
    () => ({
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
    }),
    [
      loading,
      report,
      reports,
      error,
      pagination,
      clearError,
      removeReportLocally,
    ],
  );

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
};
