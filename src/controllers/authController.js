const User = require("../models/User");
const httpError = require("../utils/httpError");
const { signToken } = require("../middleware/authMiddleware");

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include a letter and a number.";
  }
  return null;
}

// POST /api/auth/register  (students and companies only; admins are seeded)
async function register(req, res, next) {
  try {
    const { name, email, password, role = "student", companyName } = req.body;

    if (!["student", "company"].includes(role)) {
      throw httpError(400, "Role must be either student or company.");
    }
    const passwordError = validatePassword(password);
    if (passwordError) throw httpError(400, passwordError);

    if (await User.exists({ email: String(email || "").trim().toLowerCase() })) {
      throw httpError(409, "An account with this email already exists.");
    }

    const data = { name, email, password, role };
    if (role === "company") {
      if (!companyName || !String(companyName).trim()) {
        throw httpError(400, "Company name is required for company accounts.");
      }
      data.companyProfile = { companyName: String(companyName).trim() };
    }

    const user = await User.create(data);
    res.status(201).json({
      message: "Account created successfully",
      token: signToken(user),
      user: user.toClient()
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const invalid = httpError(401, "Invalid email or password.");

    if (typeof email !== "string" || typeof password !== "string") throw invalid;

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) throw invalid;
    if (!user.isActive) throw httpError(403, "This account has been deactivated.");

    res.json({ message: "Logged in", token: signToken(user), user: user.toClient() });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/me
async function me(req, res) {
  res.json({ user: req.user.toClient() });
}

// PUT /api/auth/password
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (typeof currentPassword !== "string" || !(await user.comparePassword(currentPassword))) {
      throw httpError(400, "Current password is incorrect.");
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) throw httpError(400, passwordError);

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, me, changePassword };
