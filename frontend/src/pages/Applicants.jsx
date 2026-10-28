import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, downloadFile } from "../api";
import StatusBadge from "../components/StatusBadge";
import { useApi } from "../hooks/useApi";
import { APPLICATION_STATUSES, formatDate, toDateInput } from "../utils/format";

// Statuses a company can set (Applied/Withdrawn are controlled by the student).
const SETTABLE = ["Under Review", "Shortlisted", "Interview", "Offered", "Rejected"];

function ApplicantCard({ application, onSaved }) {
  const { student } = application;
  const profile = student?.studentProfile || {};
  const locked = application.status === "Withdrawn";

  const [status, setStatus] = useState(
    SETTABLE.includes(application.status) ? application.status : "Under Review"
  );
  const [feedback, setFeedback] = useState(application.feedback || "");
  const [interviewDate, setInterviewDate] = useState(
    toDateInput(application.interviewDate)
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      await api(`/applications/${application._id}/status`, {
        method: "PATCH",
        body: {
          status,
          feedback,
          interviewDate: status === "Interview" && interviewDate ? interviewDate : undefined,
        },
      });
      setNotice({ type: "success", text: "Saved." });
      onSaved();
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    try {
      await downloadFile(`/applications/${application._id}/resume`, application.resume?.originalName);
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
  }

  return (
    <article className="app-card">
      <div className="app-card-head">
        <div>
          <h3>{student?.name || "Deleted user"}</h3>
          <p className="company-name">
            for <Link to={`/internships/${application.internship?._id}`}>{application.internship?.title}</Link>
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="applicant-info">
        {student?.email && <a href={`mailto:${student.email}`}>{student.email}</a>}
        {profile.phone && <span>{profile.phone}</span>}
        {(profile.university || profile.degree) && (
          <span>{[profile.degree, profile.university].filter(Boolean).join(" · ")}</span>
        )}
        {profile.graduationYear && <span>Graduating {profile.graduationYear}</span>}
        <span>Applied {formatDate(application.createdAt)}</span>
      </div>

      {profile.skills?.length > 0 && (
        <div className="chips">
          {profile.skills.map((skill) => <span className="chip" key={skill}>{skill}</span>)}
        </div>
      )}

      <div className="link-row">
        {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
        {profile.github && <a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>}
        {profile.portfolio && <a href={profile.portfolio} target="_blank" rel="noreferrer">Portfolio ↗</a>}
      </div>

      {application.coverLetter && (
        <details>
          <summary>Cover letter</summary>
          <p className="cover-letter">{application.coverLetter}</p>
        </details>
      )}

      <form className="review-form" onSubmit={save}>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)} disabled={locked}>
            {SETTABLE.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        {status === "Interview" && (
          <label>
            Interview date
            <input type="date" value={interviewDate} onChange={(event) => setInterviewDate(event.target.value)} disabled={locked} />
          </label>
        )}
        <label className="grow">
          Message to student (visible to them)
          <input
            value={feedback}
            maxLength={1000}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="e.g. Please bring your portfolio to the interview"
            disabled={locked}
          />
        </label>
        <div className="card-actions">
          <button className="primary-button small" type="submit" disabled={busy || locked}>
            {busy ? "Saving..." : "Save"}
          </button>
          <button className="secondary-button small" type="button" onClick={download}>
            Download resume
          </button>
        </div>
      </form>
      {locked && <p className="muted">The student withdrew this application.</p>}
      {notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}
    </article>
  );
}

export default function Applicants() {
  const [params, setParams] = useSearchParams();
  const internshipId = params.get("internship") || "";
  const status = params.get("status") || "";

  const postings = useApi("/internships/mine");

  const query = new URLSearchParams();
  if (internshipId) query.set("internship", internshipId);
  if (status) query.set("status", status);
  const applications = useApi(`/applications/received?${query}`);
  const list = applications.data?.data ?? [];

  function setFilter(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  }

  return (
    <main className="content">
      <div className="section-heading">
        <div>
          <span className="eyebrow">APPLICANTS</span>
          <h2>Review applications</h2>
          <p>Update each applicant's status. Students see changes instantly.</p>
        </div>
        <span className="count">{list.length} application{list.length === 1 ? "" : "s"}</span>
      </div>

      <div className="filter-bar">
        <select aria-label="Internship" value={internshipId} onChange={(event) => setFilter("internship", event.target.value)}>
          <option value="">All internships</option>
          {(postings.data?.data ?? []).map((item) => (
            <option key={item._id} value={item._id}>{item.title}</option>
          ))}
        </select>
        <select aria-label="Status" value={status} onChange={(event) => setFilter("status", event.target.value)}>
          <option value="">All statuses</option>
          {APPLICATION_STATUSES.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      {applications.error && <div className="notice error">{applications.error}</div>}

      {applications.loading && !applications.data ? (
        <p className="empty-state">Loading applicants...</p>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">✉</span>
          <h3>No applications found</h3>
          <p>Applications will appear here once students apply.</p>
        </div>
      ) : (
        <div className="app-list">
          {list.map((application) => (
            <ApplicantCard
              key={`${application._id}-${application.updatedAt}`}
              application={application}
              onSaved={applications.reload}
            />
          ))}
        </div>
      )}
    </main>
  );
}
