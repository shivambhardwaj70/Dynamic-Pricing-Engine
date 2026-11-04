const mongoose = require('mongoose');

/**
 * CompetitorPrice Schema
 * Stores competitor pricing for products in our catalog.
 * As defined in the project specification:
 * - productId: Reference to the Product in the Products collection
 * - competitorName: Name of competing platform (e.g., "Amazon", "Flipkart")
 * - competitorPrice: Competitor's selling price (Number, non-negative)
 * - updatedAt / createdAt: Handled automatically by timestamps
 */
const competitorPriceSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product', // Reference to the Product model
      required: [true, 'Product ID is required for competitor price record'],
    },
    competitorName: {
      type: String,
      required: [true, 'Competitor name is required (e.g., Amazon, Flipkart)'],
      trim: true,
    },
    competitorPrice: {
      type: Number,
      required: [true, 'Competitor price is required'],
      min: [0, 'Competitor price cannot be negative'],
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Compound Unique Index: Prevents duplicate records for the same competitor on the same product
// E.g., You can have Amazon for Product A and Flipkart for Product A, but not two Amazon entries for Product A
competitorPriceSchema.index({ productId: 1, competitorName: 1 }, { unique: true });

const CompetitorPrice = mongoose.model('CompetitorPrice', competitorPriceSchema);

module.exports = CompetitorPrice;

