const mongoose = require("mongoose");

const internshipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Internship title is required"],
      trim: true,
      minlength: [3, "Title must contain at least 3 characters"],
      maxlength: [120, "Title cannot exceed 120 characters"]
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"]
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must contain at least 10 characters"]
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true
    },
    internshipType: {
      type: String,
      enum: ["On-site", "Remote", "Hybrid"],
      required: [true, "Choose an internship type"]
    },
    field: {
      type: String,
      enum: [
        "Software Engineering",
        "QA / Testing",
        "Data Science",
        "Networking",
        "Cybersecurity",
        "UI/UX Design",
        "Other"
      ],
      required: [true, "Choose a field"]
    },
    duration: {
      type: String,
      required: [true, "Duration is required"],
      trim: true
    },
    stipend: {
      type: Number,
      min: [0, "Stipend cannot be negative"],
      default: 0
    },
    applicationDeadline: {
      type: Date,
      required: [true, "Application deadline is required"]
    },
    applicationUrl: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open"
    },
    postedBy: {
      type: String,
      trim: true,
      default: "University Placement Office"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Internship", internshipSchema);