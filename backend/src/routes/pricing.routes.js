const express = require('express');
const {
  calculateRecommendedPrice,
  getPricingHistory,
} = require('../controllers/pricing.controller');

// Create isolated Express router instance for pricing operations
const router = express.Router();

// POST /api/pricing/calculate-price -> Calculates dynamic price and logs recommendation to history
router.post('/calculate-price', calculateRecommendedPrice);

// GET /api/pricing/history -> Lists chronological price history (optional ?productId=...)
router.get('/history', getPricingHistory);

// GET /api/pricing/history/:productId -> Filter history directly by product ID path parameter
router.get('/history/:productId', getPricingHistory);

// GET /api/pricing/pricing-history & GET /api/pricing-history -> Alias matching PDF specification
router.get('/pricing-history', getPricingHistory);

module.exports = router;
