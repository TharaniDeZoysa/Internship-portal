import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { homeFor } from "../utils/format";
import "./Auth.css";

export default function Login() {
  const { isLoggedIn, role, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from;

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoggedIn) return <Navigate to={redirectTo || homeFor(role)} replace />;

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const loggedIn = await login(form);
      navigate(redirectTo || homeFor(loggedIn.role), { replace: true });
    } catch (err) {
      setError(err.message || "Could not log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="auth-brand" to="/">
          InternConnect
        </Link>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue your career journey.</p>

        <form onSubmit={handleSubmit} noValidate>
          {error && <div className="auth-alert" role="alert">{error}</div>}

          <label>
            Email address
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Password
            <span className="password-row">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
          </label>

          <button
            className="auth-submit"
            type="submit"
            disabled={submitting || !form.email || !form.password}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          New to InternConnect? <Link to="/register">Create account</Link>
        </p>
        <Link className="auth-back" to="/">← Back to internships</Link>
        <p className="auth-note">
          Demo accounts (after running <code>npm run seed</code>):
          student@demo.com, hr@brightbytetechnologies.com or admin@demo.com
          with password Demo1234.
        </p>
      </section>
    </main>
  );
}
