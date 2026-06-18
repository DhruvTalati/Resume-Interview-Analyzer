import React, { useState } from "react";
import "../style/interview.scss";

const Interview = () => {
  const [activeNav, setActiveNav] = useState("technical");

  return (
    <div className="interview-page">
      ```
      <div className="interview-layout">
        {/* LEFT SIDEBAR */}
        <aside className="interview-nav">
          <div className="nav-content">
            <h3>Interview Report</h3>

            <button
              className={`nav-item ${
                activeNav === "technical" ? "active" : ""
              }`}
              onClick={() => setActiveNav("technical")}
            >
              Technical Questions
            </button>

            <button
              className={`nav-item ${
                activeNav === "behavioral" ? "active" : ""
              }`}
              onClick={() => setActiveNav("behavioral")}
            >
              Behavioral Questions
            </button>

            <button
              className={`nav-item ${activeNav === "roadmap" ? "active" : ""}`}
              onClick={() => setActiveNav("roadmap")}
            >
              Preparation Roadmap
            </button>
          </div>

          <button className="download-btn">Download Resume</button>
        </aside>

        {/* CENTER */}
        <main className="interview-content">
          {activeNav === "technical" && (
            <section>
              <div className="content-header">
                <h2>Technical Questions</h2>
              </div>

              <div className="question-card">
                <h3>Explain React Hooks.</h3>

                <div className="question-section">
                  <span>Intention</span>

                  <p>Evaluate React knowledge.</p>
                </div>

                <div className="question-section">
                  <span>Suggested Answer</span>

                  <p>
                    Discuss useState, useEffect, custom hooks and practical use
                    cases.
                  </p>
                </div>
              </div>

              <div className="question-card">
                <h3>What is JWT Authentication?</h3>

                <div className="question-section">
                  <span>Intention</span>

                  <p>Check authentication concepts.</p>
                </div>

                <div className="question-section">
                  <span>Suggested Answer</span>

                  <p>Explain token generation, storage and verification.</p>
                </div>
              </div>
            </section>
          )}

          {activeNav === "behavioral" && (
            <section>
              <div className="content-header">
                <h2>Behavioral Questions</h2>
              </div>

              <div className="question-card">
                <h3>Tell me about yourself.</h3>

                <div className="question-section">
                  <span>Intention</span>

                  <p>Assess communication skills.</p>
                </div>

                <div className="question-section">
                  <span>Suggested Answer</span>

                  <p>Discuss education, projects and career goals.</p>
                </div>
              </div>
            </section>
          )}

          {activeNav === "roadmap" && (
            <section>
              <div className="content-header">
                <h2>7-Day Preparation Plan</h2>
              </div>

              <div className="roadmap-card">
                <div className="day-badge">Day 1</div>

                <h3>React Fundamentals</h3>

                <ul>
                  <li>Revise Components</li>
                  <li>Revise Props</li>
                  <li>Practice Hooks</li>
                </ul>
              </div>

              <div className="roadmap-card">
                <div className="day-badge">Day 2</div>

                <h3>NodeJS & Express</h3>

                <ul>
                  <li>Routing</li>
                  <li>Middleware</li>
                  <li>JWT</li>
                </ul>
              </div>
            </section>
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="interview-sidebar">
          <div className="match-score">
            <p>Match Score</p>

            <div className="score-ring">92%</div>

            <span>Strong Match</span>
          </div>

          <div className="sidebar-divider"></div>

          <div className="skill-gaps">
            <h3>Skill Gaps</h3>

            <div className="skills-list">
              <span className="skill high">TypeScript</span>

              <span className="skill medium">Docker</span>

              <span className="skill low">AWS</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Interview;
