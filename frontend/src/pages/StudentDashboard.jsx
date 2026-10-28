import { useState } from "react";
import { Link } from "react-router-dom";
import { api, downloadFile } from "../api";
import ApplicationPipeline from "../components/ApplicationPipeline";
import InternshipCard from "../components/InternshipCard";
import StatusBadge from "../components/StatusBadge";
import { useApi } from "../hooks/useApi";
import { useSavedInternships } from "../hooks/useSavedInternships";
import { formatDate, formatDateTime } from "../utils/format";

const FINAL = ["Rejected", "Withdrawn", "Offered"];

function ApplicationCard({ application, onChanged, onError }) {
  const { internship } = application;
  const [busy, setBusy] = useState(false);

  async function withdraw() {
    if (!window.confirm("Withdraw this application?")) return;
    setBusy(true);
    try {
      await api(`/applications/${application._id}/withdraw`, { method: "PATCH" });
      onChanged();
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    try {
      await downloadFile(
        `/applications/${application._id}/resume`,
        application.resume?.originalName
      );
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <article className="app-card">
      <div className="app-card-head">
        <div>
          <h3>
            {internship ? (
              <Link to={`/internships/${internship._id}`}>{internship.title}</Link>
            ) : (
              "Internship no longer available"
            )}
          </h3>
          <p className="company-name">{internship?.company}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <ApplicationPipeline status={application.status} />

      <p className="app-meta">
        Applied {formatDate(application.createdAt)} · Last update {formatDate(application.updatedAt)}
      </p>

      {application.interviewDate && application.status === "Interview" && (
        <p className="notice success">Interview: {formatDateTime(application.interviewDate)}</p>
      )}
      {application.feedback && (
        <p className="feedback">
          <strong>Message from the company:</strong> {application.feedback}
        </p>
      )}

      <details>
        <summary>History</summary>
        <ul className="history">
          {application.statusHistory.map((entry, index) => (
            <li key={index}>
              <strong>{entry.status}</strong> · {formatDateTime(entry.changedAt)}
              {entry.note && <span> — {entry.note}</span>}
            </li>
          ))}
        </ul>
      </details>

      <div className="card-actions">
        <button className="secondary-button small" onClick={download}>
          Download my resume
        </button>
        {!FINAL.includes(application.status) && (
          <button className="delete-button small" onClick={withdraw} disabled={busy}>
            Withdraw
          </button>
        )}
      </div>
    </article>
  );
}

export default function StudentDashboard() {
  const [tab, setTab] = useState("applications");
  const [error, setError] = useState("");
  const applications = useApi("/applications/mine");
  const saved = useSavedInternships();

  const list = applications.data?.data ?? [];
  const count = (...statuses) => list.filter((item) => statuses.includes(item.status)).length;

  async function toggleSave(id) {
    setError("");
    try {
      await saved.toggle(id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="content">
      <div className="section-heading">
        <div>
          <span className="eyebrow">STUDENT DASHBOARD</span>
          <h2>My applications</h2>
          <p>Track where each application stands.</p>
        </div>
        <Link className="primary-button" to="/internships">Find more internships</Link>
      </div>

      <div className="stat-grid">
        <div className="stat"><strong>{list.length}</strong><span>Total applications</span></div>
        <div className="stat"><strong>{count("Applied", "Under Review")}</strong><span>In review</span></div>
        <div className="stat"><strong>{count("Shortlisted", "Interview")}</strong><span>Shortlisted / interview</span></div>
        <div className="stat"><strong>{count("Offered")}</strong><span>Offers</span></div>
      </div>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "applications"} className={tab === "applications" ? "active" : ""} onClick={() => setTab("applications")}>
          Applications ({list.length})
        </button>
        <button role="tab" aria-selected={tab === "saved"} className={tab === "saved" ? "active" : ""} onClick={() => setTab("saved")}>
          Saved ({saved.items.length})
        </button>
      </div>

      {(error || applications.error) && (
        <div className="notice error">{error || applications.error}</div>
      )}

      {tab === "applications" &&
        (applications.loading && !applications.data ? (
          <p className="empty-state">Loading your applications...</p>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✉</span>
            <h3>No applications yet</h3>
            <p>Browse internships and apply to get started.</p>
            <Link className="primary-button" to="/internships">Browse internships</Link>
          </div>
        ) : (
          <div className="app-list">
            {list.map((application) => (
              <ApplicationCard
                key={application._id}
                application={application}
                onChanged={applications.reload}
                onError={setError}
              />
            ))}
          </div>
        ))}

      {tab === "saved" &&
        (saved.items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">☆</span>
            <h3>Nothing saved</h3>
            <p>Use the Save button on an internship to keep it here.</p>
          </div>
        ) : (
          <div className="internship-grid">
            {saved.items.map((item) => (
              <InternshipCard key={item._id} item={item} saved onToggleSave={toggleSave} />
            ))}
          </div>
        ))}
    </main>
  );
}
