const jwt = require("jsonwebtoken");
const User = require("../models/User");
const httpError = require("../utils/httpError");

function signToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

async function loadUser(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;

  let payload;
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    throw httpError(401, "Your session has expired. Please log in again.");
  }

  const user = await User.findById(payload.id);
  if (!user) throw httpError(401, "Account no longer exists.");
  if (!user.isActive) throw httpError(403, "This account has been deactivated.");
  return user;
}

// Require a valid token.
async function protect(req, res, next) {
  try {
    const user = await loadUser(req);
    if (!user) throw httpError(401, "Please log in to continue.");
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

// Attach req.user when a token is present, but allow anonymous access.
async function optionalAuth(req, res, next) {
  try {
    req.user = (await loadUser(req)) || undefined;
    next();
  } catch (error) {
    next(error);
  }
}

// Restrict a route to the given roles: authorize("company", "admin")
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(httpError(403, "You do not have permission to do this."));
    }
    next();
  };
}

module.exports = { signToken, protect, optionalAuth, authorize };
