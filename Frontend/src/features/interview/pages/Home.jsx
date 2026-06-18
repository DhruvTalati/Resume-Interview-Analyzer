import "../style/home.scss";

const Home = () => {
  return (
    <div className="home-page">
      {/* Header */}
      <header className="page-header">
        <div className="badge">AI Powered Interview Preparation</div>

        <h1>
          Resume Interview <span className="highlight">Analyzer</span>
        </h1>

        <p>
          Upload your resume, paste a job description and get a personalized
          interview strategy powered by AI.
        </p>

        <div className="feature-list">
          <span>✓ Match Score</span>
          <span>✓ Technical Questions</span>
          <span>✓ Behavioral Questions</span>
          <span>✓ Skill Gap Detection</span>
          <span>✓ 7-Day Plan</span>
        </div>
      </header>

      {/* Main Card */}
      <div className="interview-card">
        <div className="interview-card__body">
          {/* Job Description */}
          <section className="panel panel--left">
            <div className="panel__header">
              <h2>Target Job Description</h2>

              <span className="badge badge--required">Required</span>
            </div>

            <textarea
              className="panel__textarea"
              placeholder="Paste the complete job description here..."
            />

            <div className="char-counter">0 / 5000 chars</div>
          </section>

          <div className="panel-divider"></div>

          {/* Candidate Profile */}
          <section className="panel panel--right">
            <div className="panel__header">
              <h2>Your Profile</h2>
            </div>

            {/* Resume Upload */}
            <div className="upload-section">
              <label className="section-label">
                Upload Resume
                <span className="badge badge--best">Best Results</span>
              </label>

              <label className="dropzone">
                <div className="dropzone__icon">📄</div>

                <p className="dropzone__title">
                  Click to upload or drag & drop
                </p>

                <p className="dropzone__subtitle">PDF or DOCX (Max 5MB)</p>

                <input hidden type="file" accept=".pdf,.docx" />
              </label>
            </div>

            {/* OR Divider */}
            <div className="or-divider">
              <span>OR</span>
            </div>

            {/* Self Description */}
            <div className="self-description">
              <label htmlFor="selfDescription" className="section-label">
                Quick Self Description
              </label>

              <textarea
                id="selfDescription"
                className="panel__textarea panel__textarea--short"
                placeholder="Describe your skills, experience and achievements..."
              />
            </div>

            {/* Info Box */}
            <div className="info-box">
              <span className="info-box__icon">ℹ️</span>

              <p>
                Either a <strong>Resume</strong> or a
                <strong> Self Description</strong> is required to generate a
                personalized interview report.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="interview-card__footer">
          <span className="footer-info">
            AI Powered Analysis • Approx 30 Seconds
          </span>

          <button className="generate-btn">
            ✨ Generate My Interview Strategy
          </button>
        </div>
      </div>

      {/* Recent Reports UI Only */}
      <section className="recent-reports">
        <h2>Recent Interview Reports</h2>

        <div className="reports-list">
          <div className="report-item">
            <h3>Frontend Developer</h3>
            <p>Generated on 18 June 2026</p>
            <span className="score score--high">Match Score: 89%</span>
          </div>

          <div className="report-item">
            <h3>MERN Stack Developer</h3>
            <p>Generated on 17 June 2026</p>
            <span className="score score--mid">Match Score: 72%</span>
          </div>

          <div className="report-item">
            <h3>Software Engineer</h3>
            <p>Generated on 15 June 2026</p>
            <span className="score score--low">Match Score: 54%</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="page-footer">
        <a href="#">Privacy Policy</a>

        <a href="#">Terms of Service</a>

        <a href="#">Help Center</a>
      </footer>
    </div>
  );
};

export default Home;
