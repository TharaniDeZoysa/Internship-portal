const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const httpError = require("../utils/httpError");
const { RESUME_DIR } = require("../utils/helpers");

const ALLOWED = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
};
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, RESUME_DIR),
  // Random name: the client-supplied name is never used on disk.
  filename: (req, file, cb) =>
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED[ext] || !ALLOWED[ext].includes(file.mimetype)) {
    return cb(httpError(400, "Resume must be a PDF, DOC or DOCX file."));
  }
  cb(null, true);
}

const uploadResume = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE, files: 1 } }).single("resume");

module.exports = { uploadResume, MAX_SIZE };
