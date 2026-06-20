import "../style/ATSResume.scss";
import { useState } from "react";

const ATSResume = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!file) {
      alert("Please upload a resume first");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  };

  return (
    <div className="ats-page">
      <div className="ats-header">
        <h1>📑 ATS Resume Checker</h1>
        <p>
          Upload your resume and check how well it performs against ATS systems.
        </p>
      </div>

      <div className="ats-card">
        <label className="upload-box">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <div className="upload-content">
            <h3>📄 Upload Resume</h3>
            <p>PDF files only</p>
          </div>
        </label>

        {file && <p className="selected-file">✅ {file.name}</p>}

        <button
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? "📊 Checking ATS Score..." : "Analyze Resume"}
        </button>
      </div>

      <div className="result-card">
        <h2>ATS Score</h2>
        <div className="score-circle">87%</div>

        <div className="keywords">
          <h3>Missing Keywords</h3>
          <span>Docker</span>
          <span>CI/CD</span>
          <span>Redux Toolkit</span>
        </div>
      </div>
    </div>
  );
};

export default ATSResume;
