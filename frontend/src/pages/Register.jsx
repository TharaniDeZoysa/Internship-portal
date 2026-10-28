import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { homeFor } from "../utils/format";
import "./Auth.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};
  if (form.name.trim().length < 2) {
    errors.name = "Enter your full name (at least 2 characters).";
  }
  if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
    errors.password = "Password must include a letter and a number.";
  }
  if (form.role === "company" && form.companyName.trim().length < 2) {
    errors.companyName = "Enter your company name.";
  }
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
}

export default function Register() {
  const { isLoggedIn, role, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    role: "student",
    companyName: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoggedIn) return <Navigate to={homeFor(role)} replace />;

  const errors = validate(form);
  const showError = (field) => touched[field] && errors[field];

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError("");
  }

  function handleBlur(event) {
    setTouched((previous) => ({ ...previous, [event.target.name]: true }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({
      name: true,
      email: true,
      companyName: true,
      password: true,
      confirmPassword: true,
    });
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setError("");

    try {
      const created = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        companyName: form.role === "company" ? form.companyName.trim() : undefined,
      });
      navigate(homeFor(created.role), { replace: true });
    } catch (err) {
      setError(err.message || "Could not create the account.");
    } finally {
      setSubmitting(false);
    }
  }

  function field(name, label, props = {}) {
    return (
      <label>
        {label}
        <input
          name={name}
          value={form[name]}
          onChange={handleChange}
          onBlur={handleBlur}
          className={showError(name) ? "invalid" : ""}
          {...props}
        />
        {showError(name) && <span className="field-error">{errors[name]}</span>}
      </label>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="auth-brand" to="/">
          InternConnect
        </Link>
        <h1>Create your account</h1>
        <p className="auth-subtitle">
          Join us to discover internship opportunities.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {error && <div className="auth-alert" role="alert">{error}</div>}

          <div className="role-switch" role="radiogroup" aria-label="Account type">
            {[
              ["student", "I'm a student"],
              ["company", "I'm hiring"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={form.role === value}
                className={form.role === value ? "active" : ""}
                onClick={() => setForm((previous) => ({ ...previous, role: value }))}
              >
                {label}
              </button>
            ))}
          </div>

          {form.role === "company" &&
            field("companyName", "Company name", {
              type: "text",
              placeholder: "e.g. BrightByte Technologies",
              autoComplete: "organization",
            })}

          {field("name", form.role === "company" ? "Your full name" : "Full name", {
            type: "text",
            placeholder: "Enter your full name",
            autoComplete: "name",
          })}
          {field("email", "Email address", {
            type: "email",
            placeholder: "you@example.com",
            autoComplete: "email",
          })}
          {field("password", "Password", {
            type: showPassword ? "text" : "password",
            placeholder: "At least 8 characters, with a number",
            autoComplete: "new-password",
          })}
          {field("confirmPassword", "Confirm password", {
            type: showPassword ? "text" : "password",
            placeholder: "Re-enter your password",
            autoComplete: "new-password",
          })}

          <button
            type="button"
            className="toggle-password"
            style={{ position: "static", transform: "none", alignSelf: "flex-start" }}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? "Hide passwords" : "Show passwords"}
          </button>

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <Link className="auth-back" to="/">← Back to internships</Link>

      </section>
    </main>
  );
}
