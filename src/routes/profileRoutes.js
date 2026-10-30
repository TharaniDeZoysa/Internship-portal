const express = require("express");
const {
  getProfile, updateProfile, uploadResume, deleteResume, downloadResume,
  getSaved, saveInternship, unsaveInternship
} = require("../controllers/profileController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { uploadResume: handleUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();
router.use(protect);

router.route("/").get(getProfile).put(updateProfile);

router.route("/resume")
  .get(authorize("student"), downloadResume)
  .post(authorize("student"), handleUpload, uploadResume)
  .delete(authorize("student"), deleteResume);

router.get("/saved", authorize("student"), getSaved);
router.route("/saved/:id")
  .post(authorize("student"), saveInternship)
  .delete(authorize("student"), unsaveInternship);

module.exports = router;
