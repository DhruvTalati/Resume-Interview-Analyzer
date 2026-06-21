import "../auth.form.scss";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router";

const Login = () => {
  const { loading, handleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleDemoLogin = async () => {
    const demoEmail = "demo@resumeanalyzer.com";
    const demoPassword = "Demo@123";

    setEmail(demoEmail);
    setPassword(demoPassword);

    try {
      await handleLogin({
        email: demoEmail,
        password: demoPassword,
      });

      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await handleLogin({ email, password });
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <main>
        <div className="loader-container">
          <div className="loader"></div>
          <p>Please wait...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="form-container">
        <div className="form-header">
          <div className="demo-box">
            <h3> Demo Account</h3>

            <p>
              <strong>Email:</strong>
              <span className="credential"> demo@resumeanalyzer.com</span>
            </p>

            <p>
              <strong>Password:</strong>
              <span className="credential"> Demo@123</span>
            </p>
          </div>
          <h1>Resume Interview Analyzer</h1>
          <p>
            AI-powered resume analysis, interview preparation, and ATS resume
            generation.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="button primary-button"
            disabled={loading}
          >
            {loading ? "Logging In..." : "Login"}
          </button>

          <button
            type="button"
            className="button secondary-button"
            onClick={handleDemoLogin}
          >
            Try Demo Account
          </button>
        </form>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </main>
  );
};

export default Login;
