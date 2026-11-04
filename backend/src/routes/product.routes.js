const express = require('express');
const {
  createProduct,
  getAllProducts,
} = require('../controllers/product.controller');

const router = express.Router();

// Route: /api/products
router.route('/')
  .post(createProduct)
  .get(getAllProducts);

module.exports = router;

