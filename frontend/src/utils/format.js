export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatSize(bytes) {
  if (!bytes) return "";
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// <input type="date"> needs YYYY-MM-DD.
export function toDateInput(value) {
  return value ? String(value).slice(0, 10) : "";
}

export function homeFor(role) {
  if (role === "company") return "/company";
  if (role === "admin") return "/admin";
  return "/dashboard";
}

export const FIELDS = [
  "Software Engineering",
  "QA / Testing",
  "Data Science",
  "Networking",
  "Cybersecurity",
  "UI/UX Design",
  "Other",
];
export const TYPES = ["On-site", "Remote", "Hybrid"];
export const APPLICATION_STATUSES = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview",
  "Offered",
  "Rejected",
  "Withdrawn",
];
