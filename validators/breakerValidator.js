// validators/breakerValidator.js

const validateBreakerAction = (req, res, next) => {
  const { action } = req.body;

  // 1. Check if action exists in the body
  if (!action) {
    return res.status(400).json({
      message: "Validation failed: 'action' is required in the request body.",
    });
  }

  // 2. Check if action is strictly 'OPEN' or 'CLOSE'
  if (action !== "OPEN" && action !== "CLOSE") {
    return res.status(400).json({
      message: "Validation failed: 'action' must be either 'OPEN' or 'CLOSE'.",
    });
  }

  // 3. If validation passes, move to the next middleware/route handler
  next();
};

module.exports = validateBreakerAction;