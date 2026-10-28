import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/useAuth";
import { useApi } from "../hooks/useApi";
import { formatDate } from "../utils/format";

export default function AdminDashboard() {
  const { user: me } = useAuth();
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const stats = useApi("/admin/stats");
  const query = new URLSearchParams();
  if (role) query.set("role", role);
  if (debounced.trim()) query.set("search", debounced.trim());
  const users = useApi(`/admin/users?${query}`);

  const s = stats.data;
  const total = (group) => Object.values(group || {}).reduce((sum, n) => sum + n, 0);

  async function toggleActive(user) {
    setError("");
    try {
      await api(`/admin/users/${user._id}/status`, {
        method: "PATCH",
        body: { isActive: !user.isActive },
      });
      users.reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="content">
      <div className="section-heading">
        <div>
          <span className="eyebrow">ADMIN</span>
          <h2>Portal overview</h2>
          <p>Monitor activity and manage accounts.</p>
        </div>
        <Link className="secondary-button" to="/company">Manage all internships</Link>
      </div>

      {stats.error && <div className="notice error">{stats.error}</div>}
      <div className="stat-grid">
        <div className="stat"><strong>{s?.users.student ?? 0}</strong><span>Students</span></div>
        <div className="stat"><strong>{s?.users.company ?? 0}</strong><span>Companies</span></div>
        <div className="stat"><strong>{s?.internships.Open ?? 0}</strong><span>Open internships ({total(s?.internships)} total)</span></div>
        <div className="stat"><strong>{total(s?.applications)}</strong><span>Applications</span></div>
      </div>

      {s && Object.keys(s.applications).length > 0 && (
        <p className="muted">
          Applications by status:{" "}
          {Object.entries(s.applications).map(([name, n]) => `${name} ${n}`).join(" · ")}
        </p>
      )}

      <div className="listing-heading"><h3>Users</h3></div>
      <div className="filter-bar">
        <input className="search" type="search" placeholder="Search name or email..." aria-label="Search users" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select aria-label="Role" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="company">Companies</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {(error || users.error) && <div className="notice error">{error || users.error}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Joined</th><th>Status</th><th aria-label="Actions" /></tr>
          </thead>
          <tbody>
            {(users.data?.data ?? []).map((user) => (
              <tr key={user._id}>
                <td data-label="Name">
                  <strong>{user.name}</strong>
                  <div className="muted">{user.email}</div>
                </td>
                <td data-label="Role">{user.role}</td>
                <td data-label="Joined">{formatDate(user.createdAt)}</td>
                <td data-label="Status">
                  <span className={`status ${user.isActive ? "" : "closed"}`}>{user.isActive ? "Active" : "Deactivated"}</span>
                </td>
                <td className="row-actions">
                  {user._id !== me._id && (
                    <button className={user.isActive ? "delete-button small" : "secondary-button small"} onClick={() => toggleActive(user)}>
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.data && users.data.data.length === 0 && <p className="empty-state">No users found.</p>}
      </div>
    </main>
  );
}
