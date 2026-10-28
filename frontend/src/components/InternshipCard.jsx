import { Link } from "react-router-dom";
import { formatDate } from "../utils/format";

// onToggleSave is only passed for students; guests/companies see no save button.
export default function InternshipCard({ item, saved, onToggleSave }) {
  const closed = item.status === "Closed" || item.isExpired;

  return (
    <article className="internship-card">
      <div className="card-top">
        <div className="company-icon">
          {(item.company || "C").charAt(0).toUpperCase()}
        </div>
        <span className={`status ${closed ? "closed" : ""}`}>
          {closed ? "Closed" : "Open"}
        </span>
      </div>

      <h3>{item.title}</h3>
      <p className="company-name">{item.company}</p>
      <p className="description">{item.description}</p>

      <div className="metadata">
        {item.location && <span>⌖ {item.location}</span>}
        {item.internshipType && <span>⇄ {item.internshipType}</span>}
        {item.field && <span>▧ {item.field}</span>}
        {item.duration && <span>◷ {item.duration}</span>}
        <span>
          {item.stipend > 0
            ? `Stipend: ${Number(item.stipend).toLocaleString()}`
            : "Unpaid"}
        </span>
      </div>

      {item.skills?.length > 0 && (
        <div className="chips">
          {item.skills.slice(0, 4).map((skill) => (
            <span className="chip" key={skill}>{skill}</span>
          ))}
        </div>
      )}

      {item.applicationDeadline && (
        <p className="deadline">Deadline: {formatDate(item.applicationDeadline)}</p>
      )}

      <div className="card-actions">
        <Link className="primary-button small" to={`/internships/${item._id}`}>
          View details
        </Link>
        {onToggleSave && (
          <button
            type="button"
            className={`secondary-button small ${saved ? "is-saved" : ""}`}
            aria-pressed={saved}
            onClick={() => onToggleSave(item._id)}
          >
            {saved ? "★ Saved" : "☆ Save"}
          </button>
        )}
      </div>
    </article>
  );
}
