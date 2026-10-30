const path = require("path");
const fs = require("fs");

const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || "uploads");
const RESUME_DIR = path.join(UPLOAD_ROOT, "resumes");
fs.mkdirSync(RESUME_DIR, { recursive: true });

// Accept "a, b, c" or ["a", "b"] and return a clean, de-duplicated array.
function toStringList(value, max = 20) {
  const list = Array.isArray(value) ? value : String(value ?? "").split(",");
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const clean = String(item).trim().slice(0, 40);
    if (clean && !seen.has(clean.toLowerCase())) {
      seen.add(clean.toLowerCase());
      out.push(clean);
    }
  }
  return out.slice(0, max);
}

// Copy only the listed keys from an object (blocks mass-assignment).
function pick(source, keys) {
  const out = {};
  for (const key of keys) {
    if (source && source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

function resumePath(filename) {
  // basename() guards against path traversal if a bad value is ever stored.
  return path.join(RESUME_DIR, path.basename(String(filename)));
}

function removeFile(filename) {
  if (!filename) return;
  fs.unlink(resumePath(filename), () => {});
}

module.exports = { RESUME_DIR, toStringList, pick, resumePath, removeFile };
