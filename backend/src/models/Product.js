const mongoose = require('mongoose');

/**
 * Product Schema
 * Represents an item in our e-commerce product catalog.
 * As defined in the project specification:
 * - productName: Name of the product (e.g., "Wireless Mouse")
 * - category: Category of the product (e.g., "Electronics")
 * - currentPrice: Selling price of the product (e.g., 799)
 * - createdAt / updatedAt: Automatically handled by timestamps
 */
const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
    },
    currentPrice: {
      type: Number,
      required: [true, 'Current price is required'],
      min: [0, 'Current price cannot be negative'],
    },
  },
  {
    timestamps: true, // Automatically creates and manages createdAt and updatedAt
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

