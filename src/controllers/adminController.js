const mongoose = require("mongoose");
const User = require("../models/User");
const Internship = require("../models/Internship");
const Application = require("../models/Application");
const httpError = require("../utils/httpError");

// GET /api/admin/stats
async function getStats(req, res, next) {
  try {
    const [users, internships, applications] = await Promise.all([
      User.aggregate([{ $group: { _id: "$role", total: { $sum: 1 } } }]),
      Internship.aggregate([{ $group: { _id: "$status", total: { $sum: 1 } } }]),
      Application.aggregate([{ $group: { _id: "$status", total: { $sum: 1 } } }])
    ]);
    const toMap = (rows) => Object.fromEntries(rows.map((row) => [row._id, row.total]));

    res.json({
      users: toMap(users),
      internships: toMap(internships),
      applications: toMap(applications)
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/users?role=&search=
async function getUsers(req, res, next) {
  try {
    const filter = {};
    if (["student", "company", "admin"].includes(req.query.role)) filter.role = req.query.role;
    if (req.query.search && req.query.search.trim()) {
      const safe = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } }
      ];
    }
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ data: users.map((user) => user.toClient()) });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/admin/users/:id/status   { isActive: boolean }
async function setUserActive(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, "Invalid user ID");
    if (typeof req.body.isActive !== "boolean") throw httpError(400, "isActive must be true or false");
    if (req.params.id === req.user._id.toString()) {
      throw httpError(400, "You cannot deactivate your own account.");
    }

    const user = await User.findById(req.params.id);
    if (!user) throw httpError(404, "User not found");

    user.isActive = req.body.isActive;
    await user.save();
    res.json({
      message: user.isActive ? "Account activated" : "Account deactivated",
      user: user.toClient()
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getStats, getUsers, setUserActive };
