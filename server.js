require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const internshipRoutes = require("./src/routes/internshipRoutes");
const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "University Placement and Internship Portal API",
    health: "OK",
    endpoints: {
      internships: "/api/internships",
      singleInternship: "/api/internships/:id"
    }
  });
});

app.use("/api/internships", internshipRoutes);

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