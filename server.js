require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const profileRoutes = require("./src/routes/profileRoutes");
const internshipRoutes = require("./src/routes/internshipRoutes");
const applicationRoutes = require("./src/routes/applicationRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error("JWT_SECRET is missing or too short. Add a long random value to .env (see .env.example).");
  process.exit(1);
}

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  // The browser read the file name when downloading resumes.
  exposedHeaders: ["Content-Disposition"]
}));
app.use(express.json({ limit: "100kb" }));

// Slow down password guessing on the login / register endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." }
});

app.get("/", (req, res) => {
  res.json({
    message: "University Placement and Internship Portal API",
    health: "OK",
    endpoints: {
      auth: "/api/auth",
      profile: "/api/profile",
      internships: "/api/internships",
      applications: "/api/applications",
      admin: "/api/admin"
    }
  });
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
