const express = require("express");
const {
  getInternships,
  getInternshipById,
  getMyInternships,
  createInternship,
  updateInternship,
  deleteInternship
} = require("../controllers/internshipController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/")
  .get(getInternships)
  .post(protect, authorize("company", "admin"), createInternship);

// Must be declared before "/:id" so "mine" is not read as an ID.
router.get("/mine", protect, authorize("company", "admin"), getMyInternships);

router.route("/:id")
  .get(getInternshipById)
  .put(protect, authorize("company", "admin"), updateInternship)
  .delete(protect, authorize("company", "admin"), deleteInternship);

module.exports = router;
