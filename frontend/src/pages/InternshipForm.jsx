import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/useAuth";
import { useApi } from "../hooks/useApi";
import { FIELDS, TYPES, toDateInput } from "../utils/format";

const emptyForm = {
  title: "",
  company: "",
  description: "",
  location: "",
  internshipType: "",
  field: "",
  duration: "",
  stipend: "",
  openings: "1",
  skills: "",
  applicationDeadline: "",
  applicationUrl: "",
};

function toForm(item) {
  return {
    title: item.title || "",
    company: item.company || "",
    description: item.description || "",
    location: item.location || "",
    internshipType: item.internshipType || "",
    field: item.field || "",
    duration: item.duration || "",
    stipend: item.stipend ?? "",
    openings: String(item.openings ?? 1),
    skills: (item.skills || []).join(", "),
    applicationDeadline: toDateInput(item.applicationDeadline),
    applicationUrl: item.applicationUrl || "",
  };
}

// The form itself is mounted only after data is ready, so it can start from
// the loaded values without extra effects.
function Editor({ id, initial }) {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const body = {
      ...form,
      stipend: form.stipend === "" ? 0 : Number(form.stipend),
      openings: Number(form.openings) || 1,
    };
    if (role !== "admin") delete body.company; // companies post under their own name

    try {
      await api(id ? `/internships/${id}` : "/internships", {
        method: id ? "PUT" : "POST",
        body,
      });
      navigate("/company", { replace: true });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <main className="content narrow">
      <Link className="back-link" to="/company">← Back to dashboard</Link>
      <section className="form-panel">
        <h3>{id ? "Edit internship" : "Post an internship"}</h3>
        <p className="form-help">Fields marked * are required.</p>
        {error && <div className="notice error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Internship title *
              <input name="title" value={form.title} onChange={handleChange} minLength={3} required />
            </label>
            {role === "admin" && (
              <label>
                Company *
                <input name="company" value={form.company} onChange={handleChange} required />
              </label>
            )}
            <label>
              Location *
              <input name="location" value={form.location} onChange={handleChange} required />
            </label>
            <label>
              Field *
              <select name="field" value={form.field} onChange={handleChange} required>
                <option value="">Select a field</option>
                {FIELDS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Internship type *
              <select name="internshipType" value={form.internshipType} onChange={handleChange} required>
                <option value="">Select a type</option>
                {TYPES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Duration *
              <input name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 6 months" required />
            </label>
            <label>
              Monthly stipend
              <input type="number" min="0" name="stipend" value={form.stipend} onChange={handleChange} />
            </label>
            <label>
              Openings
              <input type="number" min="1" name="openings" value={form.openings} onChange={handleChange} />
            </label>
            <label>
              Application deadline *
              <input type="date" name="applicationDeadline" value={form.applicationDeadline} onChange={handleChange} required />
            </label>
            <label>
              Company / apply URL
              <input type="url" name="applicationUrl" value={form.applicationUrl} onChange={handleChange} placeholder="https://example.com" />
            </label>
            <label className="full-width">
              Required skills (comma separated)
              <input name="skills" value={form.skills} onChange={handleChange} placeholder="React, Git, Communication" />
            </label>
            <label className="full-width">
              Description * (min. 10 characters)
              <textarea name="description" value={form.description} onChange={handleChange} rows="5" minLength={10} required />
            </label>
          </div>

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Saving..." : id ? "Save changes" : "Publish internship"}
            </button>
            <Link className="secondary-button" to="/company">Cancel</Link>
          </div>
        </form>
      </section>
    </main>
  );
}

export default function InternshipForm() {
  const { id } = useParams();
  const { data, loading, error } = useApi(id ? `/internships/${id}` : null);

  if (!id) return <Editor initial={emptyForm} />;
  if (loading && !data) return <p className="page-loading">Loading...</p>;
  if (error) {
    return (
      <main className="content narrow">
        <div className="notice error">{error}</div>
        <Link className="secondary-button" to="/company">← Back to dashboard</Link>
      </main>
    );
  }
  return data ? <Editor key={id} id={id} initial={toForm(data.data)} /> : null;
}
