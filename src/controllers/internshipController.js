const mongoose = require("mongoose");
const Internship = require("../models/Internship");

// GET /api/internships - list, search, filter, sort, and paginate
async function getInternships(req, res, next) {
  try {
    const {
      search,
      field,
      type,
      status = "Open",
      sort = "newest",
      page = "1",
      limit = "10"
    } = req.query;

    const filter = {};
    if (status !== "all") filter.status = status;
    if (field) filter.field = field;
    if (type) filter.internshipType = type;

    if (search && search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { company: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { location: { $regex: safeSearch, $options: "i" } }
      ];
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      deadline: { applicationDeadline: 1 },
      stipendHigh: { stipend: -1 }
    };

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (currentPage - 1) * pageLimit;

    const [internships, total] = await Promise.all([
      Internship.find(filter)
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(pageLimit),
      Internship.countDocuments(filter)
    ]);

    res.json({
      data: internships,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit)
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/internships/:id
async function getInternshipById(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid internship ID" });
    }

    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    res.json({ data: internship });
  } catch (error) {
    next(error);
  }
}

// POST /api/internships
async function createInternship(req, res, next) {
  try {
    const internship = await Internship.create(req.body);
    res.status(201).json({
      message: "Internship created successfully",
      data: internship
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/internships/:id
async function updateInternship(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid internship ID" });
    }

    const internship = await Internship.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    res.json({
      message: "Internship updated successfully",
      data: internship
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/internships/:id
async function deleteInternship(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid internship ID" });
    }

    const internship = await Internship.findByIdAndDelete(req.params.id);
    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    res.json({ message: "Internship deleted successfully", data: internship });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getInternships,
  getInternshipById,
  createInternship,
  updateInternship,
  deleteInternship
};