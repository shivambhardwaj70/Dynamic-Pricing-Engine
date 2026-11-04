const Product = require('../models/Product');

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Public (Admin in full architecture)
 */
const createProduct = async (req, res, next) => {
  try {
    const { productName, category, currentPrice } = req.body;

    const product = await Product.create({
      productName,
      category,
      currentPrice,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    // Passes any validation or database errors to the centralized errorHandler
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
    // Sort by newest first
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
};

