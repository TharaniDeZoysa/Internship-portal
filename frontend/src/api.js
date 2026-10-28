// Small fetch wrapper for the backend. Adds the login token, turns error
// responses into Error objects with a readable message, and handles file
// downloads (which need the token too, so a plain <a href> would not work).
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "ip_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable: user will simply need to log in again */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

const OFFLINE_MESSAGE =
  "Cannot connect to the backend. Make sure it is running on port 5000.";

function buildError(response, data) {
  const details = Array.isArray(data.errors) ? ` ${data.errors.join(" ")}` : "";
  const error = new Error(
    (data.message || `Request failed (${response.status})`) + details
  );
  error.status = response.status;
  return error;
}

function handleUnauthorized(response) {
  // Token expired or account removed: drop it and tell the app to log out.
  if (response.status === 401 && getToken()) {
    clearToken();
    window.dispatchEvent(new Event("auth-expired"));
  }
}

/**
 * api("/internships")                          -> GET
 * api("/internships", { method: "POST", body })-> JSON body
 * api("/profile/resume", { method: "POST", form }) -> FormData (file upload)
 */
export async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const options = { method, headers };
  if (form) {
    options.body = form; // the browser sets the multipart boundary itself
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE}${path}`, options);
  } catch {
    throw new Error(OFFLINE_MESSAGE);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    handleUnauthorized(response);
    throw buildError(response, data);
  }
  return data;
}

// Download a protected file (e.g. a resume) and hand it to the browser.
export async function downloadFile(path, fallbackName = "resume") {
  const token = getToken();
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new Error(OFFLINE_MESSAGE);
  }

  if (!response.ok) {
    handleUnauthorized(response);
    const data = await response.json().catch(() => ({}));
    throw buildError(response, data);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
