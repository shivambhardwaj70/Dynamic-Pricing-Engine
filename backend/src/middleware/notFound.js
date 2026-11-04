/**
 * Middleware to handle unmatched routes (404 Not Found)
 * Ensures API always responds with structured JSON instead of HTML.
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = notFoundHandler;

