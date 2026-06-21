import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Register = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { loading, handleRegister } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await handleRegister({
        username,
        email,
        password,
      });

      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };
  if (loading) {
    return (
      <main>
        <h1>Loading......</h1>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="form-container">
        <div className="form-header">
          <h1>Job Resume Interview Analyzer</h1>

          <p>
            Create your account and generate AI-powered interview reports,
            skill-gap analysis, and ATS-friendly resumes.
          </p>
        </div>

        <div className="features-box">
          <p>📄 Resume Analysis</p>
          <p>🎯 Interview Questions</p>
          <p>🔍 Skill Gap Detection</p>
          <p>🚀 ATS Resume Generation</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              id="username"
              name="username"
              placeholder="Enter username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              id="password"
              name="password"
              placeholder="Create a password"
            />
            <small className="password-hint">
              Minimum 8 characters recommended
            </small>
          </div>

          <button type="submit" className="button primary-button">
            Create Account
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </main>
  );
};

export default Register;
