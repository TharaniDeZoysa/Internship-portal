const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Application = require("../models/Application");
const Internship = require("../models/Internship");
const httpError = require("../utils/httpError");
const { resumePath, removeFile } = require("../utils/helpers");

const FINAL_STATUSES = ["Rejected", "Withdrawn", "Offered"];
// Statuses a company is allowed to move an application to.
const COMPANY_STATUSES = ["Under Review", "Shortlisted", "Interview", "Offered", "Rejected"];

function checkId(id, label = "ID") {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, `Invalid ${label}`);
}

function ownsInternship(user, internship) {
  return (
    user.role === "admin" ||
    Boolean(internship.postedByUser && internship.postedByUser.equals(user._id))
  );
}

// Student fields a company may see about an applicant (no password, no resume file name).
const STUDENT_PUBLIC = "name email studentProfile";

function present(application) {
  const obj = application.toObject();
  if (obj.resume) delete obj.resume.filename;
  if (obj.student && obj.student.studentProfile && obj.student.studentProfile.resume) {
    delete obj.student.studentProfile.resume;
  }
  return obj;
}

// POST /api/applications/internship/:internshipId   (student)
// multipart: coverLetter (text), resume (optional file). Without a file the
// resume saved on the student's profile is used.
async function applyToInternship(req, res, next) {
  const uploaded = req.file;
  let stored = false; // true once an Application document owns the file
  try {
    checkId(req.params.internshipId, "internship ID");
    const internship = await Internship.findById(req.params.internshipId);
    if (!internship) throw httpError(404, "Internship not found");
    if (internship.status !== "Open") throw httpError(400, "This internship is closed.");
    if (internship.isExpired) throw httpError(400, "The application deadline has passed.");

    if (await Application.exists({ internship: internship._id, student: req.user._id })) {
      throw httpError(409, "You have already applied to this internship.");
    }

    let resume;
    if (uploaded) {
      resume = {
        filename: uploaded.filename,
        originalName: uploaded.originalname,
        mimetype: uploaded.mimetype,
        size: uploaded.size
      };
    } else {
      const saved = req.user.studentProfile.resume;
      if (!saved || !saved.filename || !fs.existsSync(resumePath(saved.filename))) {
        throw httpError(400, "Upload a resume (or add one to your profile) before applying.");
      }
      // Copy so the application keeps its own file even if the profile CV changes.
      const copyName = `${crypto.randomUUID()}${path.extname(saved.filename)}`;
      await fs.promises.copyFile(resumePath(saved.filename), resumePath(copyName));
      resume = {
        filename: copyName,
        originalName: saved.originalName,
        mimetype: saved.mimetype,
        size: saved.size
      };
    }

    let application;
    try {
      application = await Application.create({
        internship: internship._id,
        student: req.user._id,
        company: internship.postedByUser,
        coverLetter: req.body.coverLetter,
        resume,
        statusHistory: [{ status: "Applied", note: "Application submitted" }]
      });
    } catch (error) {
      removeFile(resume.filename);
      stored = true; // already cleaned up above
      throw error;
    }
    stored = true;

    res.status(201).json({
      message: "Application submitted successfully",
      data: present(application)
    });
  } catch (error) {
    // Failed before the uploaded file was attached to an application: delete it.
    if (uploaded && !stored) removeFile(uploaded.filename);
    if (error && error.code === 11000) {
      return next(httpError(409, "You have already applied to this internship."));
    }
    next(error);
  }
}

// GET /api/applications/mine   (student)
async function getMyApplications(req, res, next) {
  try {
    const applications = await Application.find({ student: req.user._id })
      .populate("internship", "title company location internshipType field applicationDeadline status")
      .sort({ createdAt: -1 });
    res.json({ data: applications.map(present) });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/applications/:id/withdraw   (student)
async function withdrawApplication(req, res, next) {
  try {
    checkId(req.params.id, "application ID");
    const application = await Application.findById(req.params.id);
    if (!application || !application.student.equals(req.user._id)) {
      throw httpError(404, "Application not found");
    }
    if (FINAL_STATUSES.includes(application.status)) {
      throw httpError(400, `A ${application.status.toLowerCase()} application cannot be withdrawn.`);
    }

    application.status = "Withdrawn";
    application.statusHistory.push({ status: "Withdrawn", note: "Withdrawn by student" });
    await application.save();
    res.json({ message: "Application withdrawn", data: present(application) });
  } catch (error) {
    next(error);
  }
}

// GET /api/applications/received?internship=&status=   (company / admin)
async function getReceivedApplications(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === "company") filter.company = req.user._id;
    if (req.query.status && Application.STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.internship) {
      checkId(req.query.internship, "internship ID");
      filter.internship = req.query.internship;
    }

    const applications = await Application.find(filter)
      .populate("student", STUDENT_PUBLIC)
      .populate("internship", "title company")
      .sort({ createdAt: -1 });
    res.json({ data: applications.map(present) });
  } catch (error) {
    next(error);
  }
}

// Loads an application and checks the current user may see it as a company/admin.
async function loadForCompany(req) {
  checkId(req.params.id, "application ID");
  const application = await Application.findById(req.params.id);
  if (!application) throw httpError(404, "Application not found");

  const internship = await Internship.findById(application.internship);
  const allowed =
    req.user.role === "admin" ||
    (application.company && application.company.equals(req.user._id)) ||
    (internship && ownsInternship(req.user, internship));
  if (!allowed) throw httpError(403, "You do not have access to this application.");
  return application;
}

// PATCH /api/applications/:id/status   (company / admin)
async function updateApplicationStatus(req, res, next) {
  try {
    const { status, feedback, interviewDate } = req.body;
    if (!COMPANY_STATUSES.includes(status)) {
      throw httpError(400, `Status must be one of: ${COMPANY_STATUSES.join(", ")}.`);
    }

    const application = await loadForCompany(req);
    if (application.status === "Withdrawn") {
      throw httpError(400, "The student has withdrawn this application.");
    }

    application.status = status;
    if (feedback !== undefined) application.feedback = feedback;
    if (status === "Interview" && interviewDate) {
      const date = new Date(interviewDate);
      if (Number.isNaN(date.getTime())) throw httpError(400, "Invalid interview date");
      application.interviewDate = date;
    }
    application.statusHistory.push({ status, note: feedback || "" });
    await application.save();

    await application.populate("student", STUDENT_PUBLIC);
    res.json({ message: "Application updated", data: present(application) });
  } catch (error) {
    next(error);
  }
}

// GET /api/applications/:id/resume   (the student, the owning company, or admin)
async function downloadApplicationResume(req, res, next) {
  try {
    checkId(req.params.id, "application ID");
    let application;
    if (req.user.role === "student") {
      application = await Application.findById(req.params.id);
      if (!application || !application.student.equals(req.user._id)) {
        throw httpError(404, "Application not found");
      }
    } else {
      application = await loadForCompany(req);
    }

    const file = application.resume;
    if (!file || !fs.existsSync(resumePath(file.filename))) {
      throw httpError(404, "Resume file not found");
    }
    res.download(resumePath(file.filename), file.originalName || "resume");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  applyToInternship,
  getMyApplications,
  withdrawApplication,
  getReceivedApplications,
  updateApplicationStatus,
  downloadApplicationResume
};
