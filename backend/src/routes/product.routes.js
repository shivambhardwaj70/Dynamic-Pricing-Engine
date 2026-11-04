const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');

// Create an isolated Express router instance for /api/products
const router = express.Router();

// Routes for the root path: /api/products
router.route('/')
  // POST /api/products -> Creates a new product in the database
  .post(createProduct)
  // GET /api/products -> Fetches all products from the database
  .get(getAllProducts);

// Routes for path with parameter: /api/products/:id
// ':id' is a dynamic route placeholder that Express captures into req.params.id
router.route('/:id')
  // GET /api/products/:id -> Fetches a single product by its MongoDB _id
  .get(getProductById)
  // PUT /api/products/:id -> Updates an existing product's fields by its _id
  .put(updateProduct)
  // DELETE /api/products/:id -> Removes a product permanently from database by its _id
  .delete(deleteProduct);

module.exports = router;
