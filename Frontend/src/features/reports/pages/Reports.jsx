import { useEffect } from "react";
import { useInterview } from "../../interview/hooks/useinterview";
import "../style/reports.scss";
import { useNavigate } from "react-router";
import api from "../../../api/axios";

const Reports = () => {
  const navigate = useNavigate();
  const { reports, getReports, loading } = useInterview();

  useEffect(() => {
    getReports();
  }, []);

  const totalReports = reports?.length || 0;

  const avgScore =
    totalReports > 0
      ? Math.round(
          reports.reduce((sum, report) => sum + (report.matchScore || 0), 0) /
            totalReports,
        )
      : 0;

  const bestScore =
    totalReports > 0
      ? Math.max(...reports.map((report) => report.matchScore || 0))
      : 0;

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this report?",
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/api/interview/${id}`);

      getReports();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="reports-page">
      <h1>📄 Interview Reports</h1>
      {loading && <p>Loading...</p>}
      {!loading && reports?.length === 0 && <p>No reports found.</p>}

      <div className="reports-stats">
        <div className="stat-box">
          <h3>{totalReports}</h3>
          <p>Total Reports</p>
        </div>

        <div className="stat-box">
          <h3>{avgScore}%</h3>
          <p>Average Score</p>
        </div>

        <div className="stat-box">
          <h3>{bestScore}%</h3>
          <p>Best Score</p>
        </div>
      </div>

      <div className="reports-grid">
        {reports?.map((report) => (
          <div key={report._id} className="report-card">
            <div className="report-header">
              <h3>{report.title || "Interview Report"}</h3>

              <div className="score-badge">{report.matchScore}%</div>
            </div>

            <div className="action-buttons">
              <button
                className="view-btn"
                onClick={() => navigate(`/interview/${report._id}`)}
              >
                View Report
              </button>

              <button
                className="delete-btn"
                onClick={() => handleDelete(report._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
