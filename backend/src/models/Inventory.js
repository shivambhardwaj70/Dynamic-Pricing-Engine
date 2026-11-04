const mongoose = require('mongoose');

/**
 * Inventory Schema
 * Represents stock levels for products in the catalog.
 * As defined in the project specification:
 * - productId: Reference to the Product in the Products collection
 * - availableQuantity: Current stock count (Number, non-negative)
 * - updatedAt / createdAt: Managed automatically by timestamps
 */
const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product', // Creates a relationship with the Product model
      required: [true, 'Product ID is required for inventory record'],
      unique: true, // Guarantees only ONE inventory document per product
    },
    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Available quantity cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically tracks createdAt and updatedAt dates
  }
);

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;

