const express = require('express');
const {
  addInventory,
  getAllInventory,
  updateStock,
} = require('../controllers/inventory.controller');

// Create isolated Express router instance for /api/inventory
const router = express.Router();

// Routes for root path: /api/inventory
router.route('/')
  // POST /api/inventory -> Adds stock record for a product
  .post(addInventory)
  // GET /api/inventory -> Lists inventory with populated product details and stock status
  .get(getAllInventory);

// Routes for path with parameter: /api/inventory/:id
router.route('/:id')
  // PUT /api/inventory/:id -> Updates availableQuantity by inventory ID or product ID
  .put(updateStock);

module.exports = router;

