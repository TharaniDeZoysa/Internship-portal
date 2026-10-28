import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/useAuth";
import { useApi } from "../hooks/useApi";
import { useSavedInternships } from "../hooks/useSavedInternships";
import { formatDate, formatSize } from "../utils/format";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXT = [".pdf", ".doc", ".docx"];

function ApplyPanel({ internship, closed }) {
  const { user } = useAuth();
  const applications = useApi("/applications/mine");
  const [coverLetter, setCoverLetter] = useState("");
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const existing = applications.data?.data.find(
    (item) => item.internship?._id === internship._id
  );
  const profileResume = user.studentProfile?.resume;

  function handleFile(event) {
    const chosen = event.target.files[0];
    setError("");
    if (!chosen) return setFile(null);

    const name = chosen.name.toLowerCase();
    if (!ALLOWED_EXT.some((ext) => name.endsWith(ext))) {
      setError("Resume must be a PDF, DOC or DOCX file.");
      setFileKey((key) => key + 1);
      return setFile(null);
    }
    if (chosen.size > MAX_SIZE) {
      setError("Resume is too large (max 5 MB).");
      setFileKey((key) => key + 1);
      return setFile(null);
    }
    setFile(chosen);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!file && !profileResume) {
      return setError("Please attach your resume.");
    }

    const form = new FormData();
    form.append("coverLetter", coverLetter);
    if (file) form.append("resume", file);

    setSubmitting(true);
    try {
      await api(`/applications/internship/${internship._id}`, { method: "POST", form });
      applications.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (applications.loading && !applications.data) return <p>Checking your applications...</p>;

  if (existing) {
    return (
      <div className="apply-done">
        <h3>You applied to this internship</h3>
        <p>
          Current status: <StatusBadge status={existing.status} />
        </p>
        <Link className="secondary-button" to="/dashboard">
          Track in my dashboard
        </Link>
      </div>
    );
  }

  if (closed) {
    return <p className="notice error">Applications are closed for this internship.</p>;
  }

  return (
    <form className="apply-form" onSubmit={handleSubmit}>
      <h3>Apply now</h3>
      {error && <div className="notice error" role="alert">{error}</div>}

      <label>
        Cover letter (optional)
        <textarea
          rows="5"
          maxLength={3000}
          value={coverLetter}
          onChange={(event) => setCoverLetter(event.target.value)}
          placeholder="Tell the company why you are a good fit..."
        />
      </label>

      <label>
        Resume (PDF, DOC or DOCX, max 5 MB)
        <input key={fileKey} type="file" accept=".pdf,.doc,.docx" onChange={handleFile} />
      </label>
      {!file && profileResume && (
        <p className="form-help">
          No file chosen: your saved resume <strong>{profileResume.originalName}</strong>{" "}
          ({formatSize(profileResume.size)}) will be sent.
        </p>
      )}
      {!file && !profileResume && (
        <p className="form-help">
          Tip: upload a resume in your <Link to="/profile">profile</Link> to reuse it on every application.
        </p>
      )}

      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}

export default function InternshipDetail() {
  const { id } = useParams();
  const { isLoggedIn, role, user } = useAuth();
  const { data, loading, error } = useApi(`/internships/${id}`);
  const saved = useSavedInternships();
  const [actionError, setActionError] = useState("");
  const [showLoginMessage, setShowLoginMessage] = useState(false);

  if (loading && !data) return <p className="page-loading">Loading internship...</p>;
  if (error) {
    return (
      <main className="content narrow">
        <div className="notice error">{error}</div>
        <Link className="secondary-button" to="/internships">← Back to internships</Link>
      </main>
    );
  }
  if (!data) return null;

  const item = data.data;
  const closed = item.status === "Closed" || item.isExpired;
  const isOwner =
    role === "admin" || (role === "company" && item.postedByUser === user._id);

  async function handleToggleSave() {
    setActionError("");
    try {
      await saved.toggle(item._id);
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <main className="content detail">
      <Link className="back-link" to="/internships">← All internships</Link>

      <div className="detail-layout">
        <article className="detail-main">
          <div className="card-top">
            <div className="company-icon large">{item.company.charAt(0).toUpperCase()}</div>
            <span className={`status ${closed ? "closed" : ""}`}>{closed ? "Closed" : "Open"}</span>
          </div>
          <h1>{item.title}</h1>
          <p className="company-name">{item.company}</p>

          <div className="metadata">
            <span>⌖ {item.location}</span>
            <span>⇄ {item.internshipType}</span>
            <span>▧ {item.field}</span>
            <span>◷ {item.duration}</span>
            <span>
              {item.stipend > 0 ? `Stipend: ${Number(item.stipend).toLocaleString()}` : "Unpaid"}
            </span>
            {item.openings > 1 && <span>{item.openings} openings</span>}
          </div>

          <h2>About the role</h2>
          <p className="detail-text">{item.description}</p>

          {item.skills?.length > 0 && (
            <>
              <h2>Skills</h2>
              <div className="chips">
                {item.skills.map((skill) => (
                  <span className="chip" key={skill}>{skill}</span>
                ))}
              </div>
            </>
          )}

          <p className="deadline">Apply before {formatDate(item.applicationDeadline)}</p>
          {item.applicationUrl && (
            <a className="apply-link" href={item.applicationUrl} target="_blank" rel="noreferrer">
              Company website ↗
            </a>
          )}
        </article>

        <aside className="detail-side">
          {actionError && <div className="notice error">{actionError}</div>}

          {!isLoggedIn && (
            <div className="apply-done">
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowLoginMessage(true)}
              >
                Interested
              </button>
              {showLoginMessage && (
                <div className="notice error" role="alert">
                  Please log in to apply.
                </div>
              )}
            </div>
          )}

          {role === "student" && (
            <>
              <ApplyPanel internship={item} closed={closed} />
              <button
                type="button"
                className={`secondary-button ${saved.ids.has(item._id) ? "is-saved" : ""}`}
                onClick={handleToggleSave}
              >
                {saved.ids.has(item._id) ? "★ Saved to my list" : "☆ Save for later"}
              </button>
            </>
          )}

          {isOwner && (
            <div className="apply-done">
              <h3>Your posting</h3>
              <Link className="primary-button" to={`/company/internships/${item._id}/edit`}>
                Edit internship
              </Link>
              <Link className="secondary-button" to={`/company/applicants?internship=${item._id}`}>
                View applicants
              </Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
