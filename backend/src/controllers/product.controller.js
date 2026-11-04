const Product = require('../models/Product');

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Public (Admin in full architecture)
 */
const createProduct = async (req, res, next) => {
  try {
    // 1. Fetch data sent by the client inside the request body (req.body)
    const { productName, category, currentPrice } = req.body;

    // 2. Store product in MongoDB using Mongoose Product model
    const product = await Product.create({
      productName,
      category,
      currentPrice,
    });

    // 3. Send response back with HTTP status 201 (Created) and the newly created product
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    // 4. Passes any validation or database errors to the centralized errorHandler
    next(error);
  }
};

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
const getAllProducts = async (req, res, next) => {
  try {
    // 1. Query MongoDB for all products, sorted by newest first (-1 means descending)
    const products = await Product.find().sort({ createdAt: -1 });

    // 2. Send response back with HTTP status 200 (OK), product count, and array of products
    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    // 3. Forward unexpected database errors to centralized errorHandler
    next(error);
  }
};

/**
 * @desc    Get a single product by its MongoDB _id
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res, next) => {
  try {
    // 1. Extract product ID from the URL path parameter (:id -> req.params.id)
    const { id } = req.params;

    // 2. Query MongoDB by its unique _id
    const product = await Product.findById(id);

    // 3. If product does not exist in database, return 404 (Not Found)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with ID: ${id}`,
      });
    }

    // 4. Return the found product with HTTP status 200 (OK)
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    // 5. Passes invalid ID format (CastError) or DB errors to centralized errorHandler
    next(error);
  }
};

/**
 * @desc    Update an existing product by its ID
 * @route   PUT /api/products/:id
 * @access  Public
 */
const updateProduct = async (req, res, next) => {
  try {
    // 1. Extract product ID from the URL path parameter
    const { id } = req.params;

    // 2. Extract updated fields sent in request body
    const { productName, category, currentPrice } = req.body;

    // 3. Find product by ID and update it in MongoDB
    // - { new: true } returns the newly updated document instead of the old one
    // - { runValidators: true } ensures Mongoose schema validations (like min: 0) run on update
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { productName, category, currentPrice },
      { new: true, runValidators: true }
    );

    // 4. If product was not found in the database, return 404 (Not Found)
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: `Product not found with ID: ${id}`,
      });
    }

    // 5. Return the updated product with HTTP status 200 (OK)
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    // 6. Forward validation or database errors to centralized errorHandler
    next(error);
  }
};

/**
 * @desc    Delete a product from the database by its ID
 * @route   DELETE /api/products/:id
 * @access  Public
 */
const deleteProduct = async (req, res, next) => {
  try {
    // 1. Extract product ID from the URL path parameter
    const { id } = req.params;

    // 2. Find the product by ID and delete it from MongoDB
    const deletedProduct = await Product.findByIdAndDelete(id);

    // 3. If product does not exist, return 404 (Not Found)
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: `Product not found with ID: ${id}`,
      });
    }

    // 4. Return success message along with the deleted product info
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: deletedProduct,
    });
  } catch (error) {
    // 5. Forward errors to centralized errorHandler
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
