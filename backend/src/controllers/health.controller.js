/**
 * Controller to handle health-check status.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
};

module.exports = {
  getHealthStatus,
};

