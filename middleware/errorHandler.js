function errorHandler(err, req, res, next) {
  console.error("GLOBAL ERROR:", err);

  const status = err.status || 500;

  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
    timestamp: new Date().toISOString(),
  });
}

module.exports = errorHandler;