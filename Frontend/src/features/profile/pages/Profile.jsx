import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import Sidebar from "../../Sidebar/Sidebar";
import "../style/profile.scss";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const reportsCount = reports.length;
  const avgScore =
    reportsCount > 0
      ? Math.round(reports.reduce((s, r) => s + r.matchScore, 0) / reportsCount)
      : 0;
  const bestScore =
    reportsCount > 0 ? Math.max(...reports.map((r) => r.matchScore || 0)) : 0;

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/api/auth/get-me");
        setUser(data.user);
        const r = await api.get("/api/interview");

        console.log(r.data);

        setReports(r.data.interviewReports || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await api.get("/api/auth/logout");
      localStorage.clear();
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const initials =
    user?.username
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const scoreClass = (s) => (s >= 80 ? "high" : s >= 60 ? "mid" : "low");

  if (!user) {
    return (
      <div className="pf-loading-screen">
        <div className="pf-loading-screen__spinner" />
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="pf-layout">
      <div className="pf-gradient pf-gradient--1" />
      <div className="pf-gradient pf-gradient--2" />
      <div className="pf-grid-bg" />

      <button
        className="pf-ham"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <main className="pf-main">
        <div className="pf-content">
          {/* Header */}
          <div className="pf-header">
            <div className="pf-header__badge">My Account</div>
            <h1 className="pf-header__title">Profile</h1>
            <p className="pf-header__sub">
              Manage your account and track your activity.
            </p>
          </div>

          {/* Stats */}
          <div className="pf-stats">
            {[
              { icon: "📄", label: "Reports Generated", value: reportsCount },
              { icon: "🎯", label: "Average Score", value: `${avgScore}%` },
              { icon: "🏆", label: "Best Score", value: `${bestScore}%` },
            ].map((s) => (
              <div key={s.label} className="pf-stat">
                <span className="pf-stat__icon">{s.icon}</span>
                <span className="pf-stat__value">{s.value}</span>
                <span className="pf-stat__label">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="pf-body">
            {/* Profile Card */}
            <div className="pf-card">
              <div className="pf-card__glow" />

              <div className="pf-avatar">{initials}</div>
              <h2 className="pf-card__name">{user.username}</h2>
              <p className="pf-card__since">
                Member since {new Date(user.createdAt).getFullYear()}
                <span className="pf-active-badge">● Active</span>
              </p>

              <div className="pf-info">
                {[
                  { icon: "📧", label: "Email", value: user.email },
                  {
                    icon: "📅",
                    label: "Joined",
                    value: new Date(user.createdAt).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "long", year: "numeric" },
                    ),
                  },
                  { icon: "🆔", label: "User ID", value: user.id, copy: true },
                ].map((item) => (
                  <div key={item.label} className="pf-info__row">
                    <span className="pf-info__label">
                      <span>{item.icon}</span> {item.label}
                    </span>
                    <div className="pf-info__val-wrap">
                      <span className="pf-info__value">{item.value}</span>
                      {item.copy && (
                        <button className="pf-copy-btn" onClick={handleCopy}>
                          {copied ? "✓ Copied" : "Copy"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pf-actions">
                <button
                  className="pf-action-btn pf-action-btn--sec"
                  onClick={() => navigate("/reports")}
                >
                  📄 Reports
                </button>
                <button
                  className="pf-action-btn pf-action-btn--sec"
                  onClick={() => navigate("/ats-resume")}
                >
                  📑 ATS Resume
                </button>
                <button
                  className="pf-action-btn pf-action-btn--danger"
                  onClick={handleLogout}
                >
                  🚪 Logout
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="pf-activity">
              <div className="pf-activity__head">
                <h2 className="pf-activity__title">
                  <span className="pf-card-icon">🕒</span>
                  Recent Reports
                </h2>
                <button
                  className="pf-see-all"
                  onClick={() => navigate("/reports")}
                >
                  See all →
                </button>
              </div>

              {reports.length > 0 ? (
                <div className="pf-activity__list">
                  {reports.slice(0, 5).map((r) => {
                    const sc = scoreClass(r.matchScore);
                    return (
                      <div
                        key={r._id}
                        className="pf-activity__item"
                        onClick={() => navigate(`/interview/${r._id}`)}
                      >
                        <div
                          className={`pf-activity__bar pf-activity__bar--${sc}`}
                        />
                        <div className="pf-activity__info">
                          <span className="pf-activity__name">
                            {r.title || "Untitled"}
                          </span>
                          <span className="pf-activity__date">
                            {new Date(r.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <span className={`pf-score pf-score--${sc}`}>
                          {r.matchScore}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="pf-activity__empty">
                  <p>No reports yet. Generate your first strategy!</p>
                  <button className="pf-gen-btn" onClick={() => navigate("/")}>
                    ✨ Generate Now
                  </button>
                </div>
              )}

              {/* Quick Links */}
              <div className="pf-quick">
                <h3 className="pf-quick__title">Quick Links</h3>
                <div className="pf-quick__grid">
                  {[
                    { icon: "✨", label: "New Strategy", path: "/" },
                    { icon: "📊", label: "Dashboard", path: "/dashboard" },
                    { icon: "📄", label: "All Reports", path: "/reports" },
                    { icon: "📑", label: "ATS Resume", path: "/ats-resume" },
                  ].map((q) => (
                    <button
                      key={q.path}
                      className="pf-quick__btn"
                      onClick={() => navigate(q.path)}
                    >
                      <span>{q.icon}</span>
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
