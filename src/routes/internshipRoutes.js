const express = require("express");
const {
  getInternships,
  getInternshipById,
  createInternship,
  updateInternship,
  deleteInternship
} = require("../controllers/internshipController");

const router = express.Router();

router.route("/")
  .get(getInternships)
  .post(createInternship);

router.route("/:id")
  .get(getInternshipById)
  .put(updateInternship)
  .delete(deleteInternship);

module.exports = router;