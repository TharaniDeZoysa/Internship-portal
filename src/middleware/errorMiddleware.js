function notFound(req, res, next) {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

function errorHandler(error, req, res, next) {
  // Errors created with httpError(status, message) are expected, not bugs.
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error.name === "MulterError") {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Resume is too large. The maximum size is 5 MB."
        : "Could not upload the file. Send a single file in the 'resume' field.";
    return res.status(400).json({ message });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "That value is already in use." });
  }

  console.error(error);

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((item) => item.message);
    return res.status(400).json({
      message: "Validation failed",
      errors: messages
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid value supplied" });
  }

  if (error.name === "SyntaxError" && "body" in error) {
    return res.status(400).json({ message: "Invalid JSON request body" });
  }

  res.status(500).json({
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" ? { error: error.message } : {})
  });
}

module.exports = { notFound, errorHandler };