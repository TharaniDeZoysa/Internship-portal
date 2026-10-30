const express = require("express");
const {
  applyToInternship, getMyApplications, withdrawApplication,
  getReceivedApplications, updateApplicationStatus, downloadApplicationResume
} = require("../controllers/applicationController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { uploadResume } = require("../middleware/uploadMiddleware");

const router = express.Router();
router.use(protect);

// Student
router.post("/internship/:internshipId", authorize("student"), uploadResume, applyToInternship);
router.get("/mine", authorize("student"), getMyApplications);
router.patch("/:id/withdraw", authorize("student"), withdrawApplication);

// Company / admin
router.get("/received", authorize("company", "admin"), getReceivedApplications);
router.patch("/:id/status", authorize("company", "admin"), updateApplicationStatus);

// Shared (access is checked inside the controller)
router.get("/:id/resume", downloadApplicationResume);

module.exports = router;
