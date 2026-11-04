const express = require('express');
const {
  addCompetitorPrice,
  getCompetitorPrices,
  updateCompetitorPrice,
  compareProductPrices,
} = require('../controllers/competitor.controller');

// Create isolated Express router instance for /api/competitor-prices
const router = express.Router();

// Routes for root path: /api/competitor-prices
router.route('/')
  // POST /api/competitor-prices -> Adds or updates competitor price entry
  .post(addCompetitorPrice)
  // GET /api/competitor-prices -> Fetches all competitor prices (optional ?productId=...)
  .get(getCompetitorPrices);

// Route for price comparison: /api/competitor-prices/compare/:productId
// Compares our product price with all competitors and calculates metrics
router.route('/compare/:productId')
  .get(compareProductPrices);

// Routes for path with parameter: /api/competitor-prices/:id
router.route('/:id')
  // PUT /api/competitor-prices/:id -> Updates specific competitor record by its _id
  .put(updateCompetitorPrice);

module.exports = router;

