import { useRef, useState } from "react";
import { api, downloadFile } from "../api";
import { useAuth } from "../context/useAuth";
import { formatDate, formatSize } from "../utils/format";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXT = [".pdf", ".doc", ".docx"];

function Message({ notice }) {
  if (!notice) return null;
  return <div className={`notice ${notice.type}`} role="status">{notice.text}</div>;
}

function ResumeCard({ user, updateUser }) {
  const resume = user.studentProfile?.resume;
  const inputRef = useRef(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleUpload(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!ALLOWED_EXT.some((ext) => name.endsWith(ext))) {
      return setNotice({ type: "error", text: "Resume must be a PDF, DOC or DOCX file." });
    }
    if (file.size > MAX_SIZE) {
      return setNotice({ type: "error", text: "Resume is too large (max 5 MB)." });
    }

    const form = new FormData();
    form.append("resume", file);
    setBusy(true);
    setNotice(null);
    try {
      const data = await api("/profile/resume", { method: "POST", form });
      updateUser(data.user);
      setNotice({ type: "success", text: "Resume uploaded." });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Remove your saved resume? Existing applications keep their copy.")) return;
    setNotice(null);
    try {
      const data = await api("/profile/resume", { method: "DELETE" });
      updateUser(data.user);
      setNotice({ type: "success", text: "Resume removed." });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
  }

  async function handleDownload() {
    try {
      await downloadFile("/profile/resume", resume.originalName);
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
  }

  return (
    <section className="form-panel">
      <h3>Resume</h3>
      <p className="form-help">
        Upload a PDF, DOC or DOCX (max 5 MB). It is sent automatically when you apply.
      </p>
      <Message notice={notice} />

      {resume ? (
        <div className="file-row">
          <div>
            <strong>{resume.originalName}</strong>
            <span>
              {formatSize(resume.size)} · uploaded {formatDate(resume.uploadedAt)}
            </span>
          </div>
          <div className="card-actions">
            <button className="secondary-button small" onClick={handleDownload}>Download</button>
            <button className="delete-button small" onClick={handleDelete}>Remove</button>
          </div>
        </div>
      ) : (
        <p className="empty-inline">No resume uploaded yet.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        hidden
        onChange={handleUpload}
      />
      <button
        className="primary-button"
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Uploading..." : resume ? "Replace resume" : "Upload resume"}
      </button>
    </section>
  );
}

function PasswordCard() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      await api("/auth/password", { method: "PUT", body: form });
      setForm({ currentPassword: "", newPassword: "" });
      setNotice({ type: "success", text: "Password updated." });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="form-panel">
      <h3>Change password</h3>
      <Message notice={notice} />
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Current password
            <input
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="8+ characters, letter and number"
              value={form.newPassword}
              onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
              required
            />
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? "Saving..." : "Update password"}
          </button>
        </div>
      </form>
    </section>
  );
}

const SIZES = ["", "1-10", "11-50", "51-200", "201-1000", "1000+"];

function initialForm(user) {
  const student = user.studentProfile || {};
  const company = user.companyProfile || {};
  return {
    name: user.name || "",
    // student
    phone: student.phone || "",
    university: student.university || "",
    degree: student.degree || "",
    graduationYear: student.graduationYear ?? "",
    location: (user.role === "company" ? company.location : student.location) || "",
    skills: (student.skills || []).join(", "),
    bio: student.bio || "",
    linkedin: student.linkedin || "",
    github: student.github || "",
    portfolio: student.portfolio || "",
    // company
    companyName: company.companyName || "",
    industry: company.industry || "",
    website: company.website || "",
    size: company.size || "",
    description: company.description || "",
  };
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState(() => initialForm(user));
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice(null);
    setSaving(true);

    const body = { name: form.name };
    if (user.role === "student") {
      Object.assign(body, {
        phone: form.phone,
        university: form.university,
        degree: form.degree,
        graduationYear: form.graduationYear === "" ? null : Number(form.graduationYear),
        location: form.location,
        skills: form.skills,
        bio: form.bio,
        linkedin: form.linkedin,
        github: form.github,
        portfolio: form.portfolio,
      });
    } else if (user.role === "company") {
      Object.assign(body, {
        companyName: form.companyName,
        industry: form.industry,
        website: form.website,
        location: form.location,
        size: form.size,
        description: form.description,
      });
    }

    try {
      const data = await api("/profile", { method: "PUT", body });
      updateUser(data.user);
      setNotice({ type: "success", text: "Profile saved." });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const input = (name, label, props = {}) => (
    <label className={props.full ? "full-width" : ""}>
      {label}
      <input name={name} value={form[name]} onChange={handleChange} {...props.attrs} />
    </label>
  );

  return (
    <main className="content narrow">
      <div className="section-heading">
        <div>
          <span className="eyebrow">ACCOUNT</span>
          <h2>{user.role === "company" ? "Company profile" : "My profile"}</h2>
          <p>{user.email} · {user.role}</p>
        </div>
      </div>

      <section className="form-panel">
        <Message notice={notice} />
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {input("name", "Full name", { attrs: { required: true, minLength: 2 } })}

            {user.role === "student" && (
              <>
                {input("phone", "Phone")}
                {input("university", "University")}
                {input("degree", "Degree / programme")}
                {input("graduationYear", "Graduation year", {
                  attrs: { type: "number", min: 1990, max: 2100 },
                })}
                {input("location", "Location")}
                {input("skills", "Skills (comma separated)", {
                  attrs: { placeholder: "React, Python, SQL" },
                })}
                {input("linkedin", "LinkedIn URL", { attrs: { type: "url" } })}
                {input("github", "GitHub URL", { attrs: { type: "url" } })}
                {input("portfolio", "Portfolio URL", { full: true, attrs: { type: "url" } })}
                <label className="full-width">
                  About me
                  <textarea name="bio" rows="4" maxLength={800} value={form.bio} onChange={handleChange} />
                </label>
              </>
            )}

            {user.role === "company" && (
              <>
                {input("companyName", "Company name", { attrs: { required: true } })}
                {input("industry", "Industry")}
                {input("website", "Website", { attrs: { type: "url", placeholder: "https://" } })}
                {input("location", "Headquarters")}
                <label>
                  Company size
                  <select name="size" value={form.size} onChange={handleChange}>
                    {SIZES.map((size) => (
                      <option key={size} value={size}>{size || "Select size"}</option>
                    ))}
                  </select>
                </label>
                <label className="full-width">
                  About the company
                  <textarea name="description" rows="4" maxLength={1000} value={form.description} onChange={handleChange} />
                </label>
              </>
            )}
          </div>
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </section>

      {user.role === "student" && <ResumeCard user={user} updateUser={updateUser} />}
      <PasswordCard />
    </main>
  );
}
