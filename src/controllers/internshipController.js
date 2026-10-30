const mongoose = require("mongoose");
const Internship = require("../models/Internship");
const Application = require("../models/Application");
const httpError = require("../utils/httpError");
const { pick, toStringList, removeFile } = require("../utils/helpers");

const EDITABLE_FIELDS = [
  "title", "company", "description", "location", "internshipType", "field",
  "duration", "stipend", "applicationDeadline", "applicationUrl", "status", "openings"
];

function canManage(user, internship) {
  return (
    user.role === "admin" ||
    (internship.postedByUser && internship.postedByUser.equals(user._id))
  );
}

async function findManageable(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, "Invalid internship ID");
  const internship = await Internship.findById(req.params.id);
  if (!internship) throw httpError(404, "Internship not found");
  if (!canManage(req.user, internship)) {
    throw httpError(403, "You can only manage internships you posted.");
  }
  return internship;
}

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
    // "Open" listings hide postings whose deadline has passed.
    if (status === "Open") {
      filter.applicationDeadline = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
    }
    if (field) filter.field = field;
    if (type) filter.internshipType = type;

    if (search && search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { company: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { location: { $regex: safeSearch, $options: "i" } },
        { skills: { $regex: safeSearch, $options: "i" } }
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

// GET /api/internships/mine - postings of the logged-in company (admins see all)
async function getMyInternships(req, res, next) {
  try {
    const filter = req.user.role === "admin" ? {} : { postedByUser: req.user._id };
    const internships = await Internship.find(filter).sort({ createdAt: -1 });

    const counts = await Application.aggregate([
      { $match: { internship: { $in: internships.map((item) => item._id) } } },
      { $group: { _id: "$internship", total: { $sum: 1 } } }
    ]);
    const countById = new Map(counts.map((row) => [row._id.toString(), row.total]));

    res.json({
      data: internships.map((item) => ({
        ...item.toJSON(),
        applicationCount: countById.get(item._id.toString()) || 0
      }))
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/internships
async function createInternship(req, res, next) {
  try {
    const values = pick(req.body, EDITABLE_FIELDS);
    if (req.body.skills !== undefined) values.skills = toStringList(req.body.skills);

    if (req.user.role === "company") {
      // Companies always post under their own name and account.
      values.company = req.user.companyProfile.companyName || values.company;
      values.postedBy = values.company;
    } else {
      values.postedBy = values.postedBy || req.user.name;
    }
    values.postedByUser = req.user._id;

    const internship = await Internship.create(values);
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
    const internship = await findManageable(req);

    const values = pick(req.body, EDITABLE_FIELDS);
    if (req.user.role === "company") delete values.company; // name is tied to the account
    if (req.body.skills !== undefined) values.skills = toStringList(req.body.skills);

    internship.set(values);
    await internship.save();

    res.json({
      message: "Internship updated successfully",
      data: internship
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/internships/:id - also removes its applications and their CV files
async function deleteInternship(req, res, next) {
  try {
    const internship = await findManageable(req);

    const applications = await Application.find({ internship: internship._id });
    applications.forEach((item) => removeFile(item.resume && item.resume.filename));
    await Application.deleteMany({ internship: internship._id });
    await internship.deleteOne();

    res.json({ message: "Internship deleted successfully", data: internship });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getInternships,
  getInternshipById,
  getMyInternships,
  createInternship,
  updateInternship,
  deleteInternship
};