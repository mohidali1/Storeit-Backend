const errorHandler = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    // Extract validation errors and send a formatted response
    const errors = Object.values(err.errors).map((error) => error.message);
    return res.status(400).json({ message: "Validation Error", errors });
  }

  if (err.name === "CastError") {
    // Handle CastError separately
    return res.status(400).json({
      message: `Invalid value for field "${err.path}": ${err.value}`,
    });
  }

  // Handle other errors (fallback)
  res.status(500).json({ message: err.message || "Server Error" });
};

module.exports = errorHandler;
