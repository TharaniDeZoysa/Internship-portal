import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/useAuth";
import { useApi } from "../hooks/useApi";
import { formatDate } from "../utils/format";

export default function CompanyDashboard() {
  const { user, role } = useAuth();
  const { data, loading, error, reload } = useApi("/internships/mine");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const postings = data?.data ?? [];
  const open = postings.filter((item) => item.status === "Open" && !item.isExpired).length;
  const applicants = postings.reduce((sum, item) => sum + item.applicationCount, 0);

  async function run(action, success) {
    setMessage("");
    setActionError("");
    try {
      await action();
      setMessage(success);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  const toggleStatus = (item) =>
    run(
      () =>
        api(`/internships/${item._id}`, {
          method: "PUT",
          body: { status: item.status === "Open" ? "Closed" : "Open" },
        }),
      item.status === "Open" ? "Internship closed." : "Internship reopened."
    );

  const remove = (item) => {
    if (!window.confirm(`Delete "${item.title}" and all of its applications?`)) return;
    run(() => api(`/internships/${item._id}`, { method: "DELETE" }), "Internship deleted.");
  };

  return (
    <main className="content">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{role === "admin" ? "ALL POSTINGS" : "COMPANY DASHBOARD"}</span>
          <h2>{role === "admin" ? "Manage internships" : user.companyProfile?.companyName || "My postings"}</h2>
          <p>Post internships and review who applied.</p>
        </div>
        <Link className="primary-button" to="/company/internships/new">+ Post internship</Link>
      </div>

      <div className="stat-grid">
        <div className="stat"><strong>{postings.length}</strong><span>Postings</span></div>
        <div className="stat"><strong>{open}</strong><span>Open now</span></div>
        <div className="stat"><strong>{applicants}</strong><span>Total applicants</span></div>
      </div>

      {message && <div className="notice success">{message}</div>}
      {(error || actionError) && <div className="notice error">{error || actionError}</div>}

      {loading && !data ? (
        <p className="empty-state">Loading your postings...</p>
      ) : postings.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">＋</span>
          <h3>No internships yet</h3>
          <p>Create your first posting to start receiving applications.</p>
          <Link className="primary-button" to="/company/internships/new">Post an internship</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Internship</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Applicants</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {postings.map((item) => {
                const closed = item.status === "Closed" || item.isExpired;
                return (
                  <tr key={item._id}>
                    <td data-label="Internship">
                      <Link to={`/internships/${item._id}`}><strong>{item.title}</strong></Link>
                      <div className="muted">{role === "admin" ? `${item.company} · ` : ""}{item.location} · {item.internshipType}</div>
                    </td>
                    <td data-label="Status">
                      <span className={`status ${closed ? "closed" : ""}`}>
                        {item.isExpired && item.status === "Open" ? "Expired" : item.status}
                      </span>
                    </td>
                    <td data-label="Deadline">{formatDate(item.applicationDeadline)}</td>
                    <td data-label="Applicants">
                      <Link to={`/company/applicants?internship=${item._id}`}>
                        {item.applicationCount} applicant{item.applicationCount === 1 ? "" : "s"}
                      </Link>
                    </td>
                    <td className="row-actions">
                      <Link className="secondary-button small" to={`/company/internships/${item._id}/edit`}>Edit</Link>
                      <button className="secondary-button small" onClick={() => toggleStatus(item)}>
                        {item.status === "Open" ? "Close" : "Reopen"}
                      </button>
                      <button className="delete-button small" onClick={() => remove(item)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
