import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect } from "react";
import { useInterview } from "../../interview/hooks/useInterview";

import "./dashboard.scss";

const Dashboard = () => {
  const { reports, getReports, loading } = useInterview();

  useEffect(() => {
    getReports();
  }, [getReports]);

  const avgScore =
    reports?.length > 0
      ? Math.round(
          reports.reduce((sum, report) => sum + (report.matchScore || 0), 0) /
            reports.length,
        )
      : 0;

  const totalSkillGaps =
    reports?.reduce(
      (sum, report) => sum + (report.skillGaps?.length || 0),
      0,
    ) || 0;

  const avgScore =
    reports?.length > 0
      ? Math.round(
          reports.reduce((sum, report) => sum + (report.matchScore || 0), 0) /
            reports.length,
        )
      : 0;

  const totalSkillGaps =
    reports?.reduce(
      (sum, report) => sum + (report.skillGaps?.length || 0),
      0,
    ) || 0;

  const stats = {
    reports: reports?.length || 0,
    avgScore,
    resumes: reports?.length || 0,
    skillGaps: totalSkillGaps,
  };

  const chartData =
    reports?.map((report, index) => ({
      name: report.title || `Report ${index + 1}`,
      score: report.matchScore || 0,
    })) || [];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome Back 👋</h1>
        <p>Track your interview readiness and resume performance.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Reports</h3>
          <span>{stats.reports}</span>
        </div>

        <div className="stat-card">
          <h3>Average Score</h3>
          <span>{stats.avgScore}%</span>
        </div>

        <div className="stat-card">
          <h3>Resumes Generated</h3>
          <span>{stats.resumes}</span>
        </div>

        <div className="stat-card">
          <h3>Skill Gaps</h3>
          <span>{stats.skillGaps}</span>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="chart-card">
          <h2>Match Score Analytics</h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="recent-card">
          <h2>Recent Reports</h2>

          {reports?.slice(0, 5).map((report) => (
            <div key={report._id} className="report-item">
              <h4>{report.title}</h4>
              <p>Match Score: {report.matchScore}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
