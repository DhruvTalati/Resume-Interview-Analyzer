import { useState, useEffect } from "react";
import { useInterview } from "../hooks/useinterview.js";
import { useNavigate, useParams } from "react-router";
import "../style/interview.scss";

const NAV_ITEMS = [
  {
    id: "technical",
    label: "Technical",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    id: "behavioral",
    label: "Behavioral",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "roadmap",
    label: "Road Map",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </svg>
    ),
  },
];

// ── Question Card ─────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`iv-qcard ${open ? "iv-qcard--open" : ""}`}>
      <div className="iv-qcard__head" onClick={() => setOpen((o) => !o)}>
        <span className="iv-qcard__num">Q{index + 1}</span>
        <p className="iv-qcard__q">{item.question}</p>
        <span
          className={`iv-qcard__chevron ${open ? "iv-qcard__chevron--rot" : ""}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      {open && (
        <div className="iv-qcard__body">
          <div className="iv-qcard__section">
            <span className="iv-qcard__tag iv-qcard__tag--intent">
              Intention
            </span>
            <p>{item.intention}</p>
          </div>
          <div className="iv-qcard__section">
            <span className="iv-qcard__tag iv-qcard__tag--answer">
              Model Answer
            </span>
            <p>{item.answer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Road Map Day ──────────────────────────────────────────
const RoadMapDay = ({ day, total }) => (
  <div className="iv-day">
    <div className="iv-day__dot" />
    <div className="iv-day__card">
      <div className="iv-day__head">
        <span className="iv-day__badge">Day {day.day}</span>
        <div className="iv-day__prog-wrap">
          <div className="iv-day__prog">
            <div
              className="iv-day__prog-fill"
              style={{ width: `${(day.day / total) * 100}%` }}
            />
          </div>
          <span className="iv-day__prog-label">
            {day.day}/{total}
          </span>
        </div>
      </div>
      <h3 className="iv-day__focus">{day.focus}</h3>
      <ul className="iv-day__tasks">
        {day.tasks.map((task, i) => (
          <li key={i}>
            <span className="iv-day__bullet" />
            {task}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────
const Interview = () => {
  const [activeNav, setActiveNav] = useState("technical");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { report, getReportById, loading, getResumePdf } = useInterview();
  const { interviewId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (interviewId) getReportById(interviewId);
  }, [interviewId]);

  if (loading || !report) {
    return (
      <div className="iv-loading">
        <div className="iv-loading__spinner" />
        <p>Building your interview plan…</p>
      </div>
    );
  }

  const scoreClass =
    report.matchScore >= 80 ? "high" : report.matchScore >= 60 ? "mid" : "low";
  const CIRC = 2 * Math.PI * 38;
  const offset = CIRC - (report.matchScore / 100) * CIRC;

  return (
    <div className="iv-page">
      {/* BG FX */}
      <div className="iv-grad iv-grad--1" />
      <div className="iv-grad iv-grad--2" />
      <div className="iv-grid-bg" />

      {/* Top Bar */}
      <header className="iv-topbar">
        <div className="iv-topbar__left">
          <button className="iv-back" onClick={() => navigate(-1)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="iv-topbar__brand">
            <div className="iv-topbar__mark">R</div>
            <span>ResumeAI</span>
          </div>
          <div className="iv-topbar__sep" />
          <h1 className="iv-topbar__title">
            {report.title || "Interview Plan"}
          </h1>
        </div>
        <div className="iv-topbar__right">
          <span className={`iv-topbar__score iv-topbar__score--${scoreClass}`}>
            {report.matchScore}% Match
          </span>
          <button
            className="iv-download-btn"
            onClick={() => getResumePdf(interviewId)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z" />
            </svg>
            Download Resume
          </button>
          {/* Mobile nav toggle */}
          <button
            className="iv-mob-nav-btn"
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            ☰
          </button>
        </div>
      </header>

      <div className="iv-body">
        {/* ── Left Nav ── */}
        <nav className={`iv-nav ${mobileNavOpen ? "iv-nav--open" : ""}`}>
          <p className="iv-nav__label">Sections</p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`iv-nav__item ${activeNav === item.id ? "iv-nav__item--active" : ""}`}
              onClick={() => {
                setActiveNav(item.id);
                setMobileNavOpen(false);
              }}
            >
              <span className="iv-nav__icon">{item.icon}</span>
              {item.label}
              {activeNav === item.id && <span className="iv-nav__dot" />}
            </button>
          ))}

          {/* Mini score in nav */}
          <div className="iv-nav__score-mini">
            <svg width="90" height="90" viewBox="0 0 90 90">
              <defs>
                <linearGradient id="ivGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop
                    offset="0%"
                    stopColor={
                      scoreClass === "high"
                        ? "#00c6a2"
                        : scoreClass === "mid"
                          ? "#f59e0b"
                          : "#ef4444"
                    }
                  />
                  <stop
                    offset="100%"
                    stopColor={
                      scoreClass === "high"
                        ? "#00b4d8"
                        : scoreClass === "mid"
                          ? "#fbbf24"
                          : "#f87171"
                    }
                  />
                </linearGradient>
              </defs>
              <circle
                cx="45"
                cy="45"
                r="38"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
              />
              <circle
                cx="45"
                cy="45"
                r="38"
                fill="none"
                stroke="url(#ivGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={offset}
                transform="rotate(-90 45 45)"
              />
            </svg>
            <div className="iv-nav__score-inner">
              <span className="iv-nav__score-val">{report.matchScore}%</span>
              <span className="iv-nav__score-sub">Match</span>
            </div>
          </div>
        </nav>

        {/* ── Center ── */}
        <main className="iv-center">
          {activeNav === "technical" && (
            <section className="iv-section">
              <div className="iv-section__head">
                <h2>Technical Questions</h2>
                <span className="iv-section__count">
                  {report.technicalQuestions.length} questions
                </span>
              </div>
              <div className="iv-qlist">
                {report.technicalQuestions.map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {activeNav === "behavioral" && (
            <section className="iv-section">
              <div className="iv-section__head">
                <h2>Behavioral Questions</h2>
                <span className="iv-section__count">
                  {report.behavioralQuestions.length} questions
                </span>
              </div>
              <div className="iv-qlist">
                {report.behavioralQuestions.map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {activeNav === "roadmap" && (
            <section className="iv-section">
              <div className="iv-section__head">
                <h2>Preparation Road Map</h2>
                <span className="iv-section__count">
                  {report.preparationPlan.length}-day plan
                </span>
              </div>
              <div className="iv-roadmap">
                <div className="iv-roadmap__line" />
                {report.preparationPlan.map((day) => (
                  <RoadMapDay
                    key={day.day}
                    day={day}
                    total={report.preparationPlan.length}
                  />
                ))}
              </div>
            </section>
          )}
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="iv-aside">
          {/* Score Ring */}
          <div className="iv-aside__card">
            <p className="iv-aside__label">Match Score</p>
            <div className="iv-score-ring">
              <svg width="110" height="110" viewBox="0 0 110 110">
                <defs>
                  <linearGradient id="asideGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop
                      offset="0%"
                      stopColor={
                        scoreClass === "high"
                          ? "#00c6a2"
                          : scoreClass === "mid"
                            ? "#f59e0b"
                            : "#ef4444"
                      }
                    />
                    <stop
                      offset="100%"
                      stopColor={
                        scoreClass === "high"
                          ? "#00b4d8"
                          : scoreClass === "mid"
                            ? "#fbbf24"
                            : "#f87171"
                      }
                    />
                  </linearGradient>
                </defs>
                <circle
                  cx="55"
                  cy="55"
                  r="46"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="10"
                />
                <circle
                  cx="55"
                  cy="55"
                  r="46"
                  fill="none"
                  stroke="url(#asideGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={
                    2 * Math.PI * 46 * (1 - report.matchScore / 100)
                  }
                  transform="rotate(-90 55 55)"
                />
              </svg>
              <div className="iv-score-ring__inner">
                <span className="iv-score-ring__val">{report.matchScore}</span>
                <span className="iv-score-ring__pct">%</span>
              </div>
            </div>
            <p
              className={`iv-score-ring__status iv-score-ring__status--${scoreClass}`}
            >
              {scoreClass === "high"
                ? "🔥 Strong Match"
                : scoreClass === "mid"
                  ? "👍 Good Match"
                  : "⚠ Needs Work"}
            </p>
          </div>

          {/* Progress bars per section */}
          <div className="iv-aside__card">
            <p className="iv-aside__label">Coverage</p>
            {[
              {
                label: "Technical",
                count: report.technicalQuestions.length,
                max: 15,
              },
              {
                label: "Behavioral",
                count: report.behavioralQuestions.length,
                max: 10,
              },
              {
                label: "Prep Days",
                count: report.preparationPlan.length,
                max: 14,
              },
            ].map((s) => (
              <div key={s.label} className="iv-coverage">
                <div className="iv-coverage__top">
                  <span className="iv-coverage__name">{s.label}</span>
                  <span className="iv-coverage__val">{s.count}</span>
                </div>
                <div className="iv-coverage__bar">
                  <div
                    className="iv-coverage__fill"
                    style={{
                      width: `${Math.min((s.count / s.max) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Skill Gaps */}
          {report.skillGaps?.length > 0 && (
            <div className="iv-aside__card">
              <p className="iv-aside__label">Skill Gaps</p>
              <div className="iv-gaps">
                {report.skillGaps.map((gap, i) => (
                  <span
                    key={i}
                    className={`iv-gap-tag iv-gap-tag--${gap.severity}`}
                  >
                    {gap.skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Interview;
