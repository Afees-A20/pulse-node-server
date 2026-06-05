function validateBreakerAction(req, res, next) {
  const { action } = req.body;

  const allowed = ["OPEN", "CLOSE"];

  if (!action) {
    return res.status(400).json({
      message: "Action is required",
    });
  }

  if (!allowed.includes(action)) {
    return res.status(400).json({
      message: "Invalid action. Must be OPEN or CLOSE",
    });
  }

  next();
}

module.exports = validateBreakerAction;