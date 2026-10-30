const fs = require("fs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Internship = require("../models/Internship");
const httpError = require("../utils/httpError");
const { pick, toStringList, resumePath, removeFile } = require("../utils/helpers");

const STUDENT_FIELDS = [
  "phone", "university", "degree", "graduationYear", "location",
  "bio", "linkedin", "github", "portfolio"
];
const COMPANY_FIELDS = ["companyName", "industry", "website", "location", "size", "description"];

// GET /api/profile
async function getProfile(req, res) {
  res.json({ user: req.user.toClient() });
}

// PUT /api/profile
async function updateProfile(req, res, next) {
  try {
    const user = req.user;
    const body = req.body || {};

    if (body.name !== undefined) user.name = body.name;

    if (user.role === "student") {
      const values = pick(body, STUDENT_FIELDS);
      if (values.graduationYear === "" || values.graduationYear === null) {
        values.graduationYear = undefined;
      }
      Object.assign(user.studentProfile, values);
      if (body.skills !== undefined) user.studentProfile.skills = toStringList(body.skills);
    } else if (user.role === "company") {
      const values = pick(body, COMPANY_FIELDS);
      if (values.companyName !== undefined && !String(values.companyName).trim()) {
        throw httpError(400, "Company name cannot be empty.");
      }
      Object.assign(user.companyProfile, values);
    }

    await user.save();
    res.json({ message: "Profile updated", user: user.toClient() });
  } catch (error) {
    next(error);
  }
}

// POST /api/profile/resume   (multipart field "resume")
async function uploadResume(req, res, next) {
  try {
    if (!req.file) throw httpError(400, "Choose a PDF, DOC or DOCX file to upload.");

    const user = req.user;
    const previous = user.studentProfile.resume && user.studentProfile.resume.filename;

    user.studentProfile.resume = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date()
    };
    await user.save();

    // Applications keep their own copies of the CV, so the old profile file
    // can be deleted safely.
    removeFile(previous);

    res.status(201).json({ message: "Resume uploaded", user: user.toClient() });
  } catch (error) {
    if (req.file) removeFile(req.file.filename);
    next(error);
  }
}

// DELETE /api/profile/resume
async function deleteResume(req, res, next) {
  try {
    const user = req.user;
    const current = user.studentProfile.resume && user.studentProfile.resume.filename;
    if (!current) throw httpError(404, "You have not uploaded a resume.");

    user.studentProfile.resume = undefined;
    await user.save();
    removeFile(current);

    res.json({ message: "Resume removed", user: user.toClient() });
  } catch (error) {
    next(error);
  }
}

// GET /api/profile/resume  - download your own resume
async function downloadResume(req, res, next) {
  try {
    const resume = req.user.studentProfile.resume;
    if (!resume || !resume.filename || !fs.existsSync(resumePath(resume.filename))) {
      throw httpError(404, "You have not uploaded a resume.");
    }
    res.download(resumePath(resume.filename), resume.originalName || "resume");
  } catch (error) {
    next(error);
  }
}

// GET /api/profile/saved
async function getSaved(req, res, next) {
  try {
    const user = await User.findById(req.user._id).populate("savedInternships");
    res.json({ data: user.savedInternships.filter(Boolean) });
  } catch (error) {
    next(error);
  }
}

// POST /api/profile/saved/:id
async function saveInternship(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, "Invalid internship ID");
    if (!(await Internship.exists({ _id: req.params.id }))) {
      throw httpError(404, "Internship not found");
    }
    await User.updateOne({ _id: req.user._id }, { $addToSet: { savedInternships: req.params.id } });
    res.json({ message: "Internship saved" });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/profile/saved/:id
async function unsaveInternship(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, "Invalid internship ID");
    await User.updateOne({ _id: req.user._id }, { $pull: { savedInternships: req.params.id } });
    res.json({ message: "Internship removed from saved list" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile, updateProfile, uploadResume, deleteResume, downloadResume,
  getSaved, saveInternship, unsaveInternship
};
