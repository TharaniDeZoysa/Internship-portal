const mongoose = require("mongoose");

const STATUSES = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview",
  "Offered",
  "Rejected",
  "Withdrawn"
];

const applicationSchema = new mongoose.Schema(
  {
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
      required: true,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    // The user (company) who owns the internship at the time of applying.
    company: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [3000, "Cover letter cannot exceed 3000 characters"],
      default: ""
    },
    // Each application keeps its own copy of the CV so later profile changes
    // do not alter what the company already received.
    resume: {
      filename: { type: String, required: true },
      originalName: String,
      mimetype: String,
      size: Number
    },
    status: { type: String, enum: STATUSES, default: "Applied" },
    feedback: { type: String, trim: true, maxlength: 1000, default: "" },
    interviewDate: { type: Date },
    statusHistory: [
      {
        status: { type: String, enum: STATUSES },
        note: { type: String, default: "" },
        changedAt: { type: Date, default: Date.now },
        _id: false
      }
    ]
  },
  { timestamps: true }
);

// A student can apply to a given internship only once.
applicationSchema.index({ internship: 1, student: 1 }, { unique: true });

applicationSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model("Application", applicationSchema);
