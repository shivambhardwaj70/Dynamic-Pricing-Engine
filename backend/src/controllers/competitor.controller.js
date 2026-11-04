const CompetitorPrice = require('../models/CompetitorPrice');
const Product = require('../models/Product');

/**
 * @desc    Add or update a competitor price for a product
 * @route   POST /api/competitor-prices
 * @access  Public (Admin)
 */
const addCompetitorPrice = async (req, res, next) => {
  try {
    // 1. Extract input fields from request body
    const { productId, competitorName, competitorPrice } = req.body;

    // 2. Validate that the product exists in our catalog
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with ID: ${productId}`,
      });
    }

    // 3. Check if we already have a record for this specific competitor on this product
    let competitorRecord = await CompetitorPrice.findOne({ productId, competitorName });

    if (competitorRecord) {
      // If record exists, update the competitor price
      competitorRecord.competitorPrice = competitorPrice;
      await competitorRecord.save();
    } else {
      // Otherwise, create a new competitor pricing record
      competitorRecord = await CompetitorPrice.create({
        productId,
        competitorName,
        competitorPrice,
      });
    }

    // 4. Populate product information (productName, category, currentPrice)
    await competitorRecord.populate('productId', 'productName category currentPrice');

    // 5. Send response with 201 Created
    res.status(201).json({
      success: true,
      message: 'Competitor price recorded successfully',
      data: competitorRecord,
    });
  } catch (error) {
    // 6. Forward errors to centralized errorHandler
    next(error);
  }
};

/**
 * @desc    Get all competitor prices (optionally filter by ?productId=...)
 * @route   GET /api/competitor-prices
 * @access  Public
 */
const getCompetitorPrices = async (req, res, next) => {
  try {
    // 1. Check for optional query filter (?productId=...)
    const { productId } = req.query;
    const filter = productId ? { productId } : {};

    // 2. Query MongoDB and populate product information
    const competitorPrices = await CompetitorPrice.find(filter)
      .populate('productId', 'productName category currentPrice')
      .sort({ updatedAt: -1 });

    // 3. Return response with 200 OK
    res.status(200).json({
      success: true,
      count: competitorPrices.length,
      data: competitorPrices,
    });
  } catch (error) {
    // 4. Forward errors to centralized errorHandler
    next(error);
  }
};

/**
 * @desc    Update a competitor price by record ID
 * @route   PUT /api/competitor-prices/:id
 * @access  Public (Admin)
 */
const updateCompetitorPrice = async (req, res, next) => {
  try {
    // 1. Extract record ID from URL path parameter (:id)
    const { id } = req.params;

    // 2. Extract updated fields from request body
    const { competitorPrice, competitorName } = req.body;

    // 3. Find and update the competitor record in MongoDB
    const updatedRecord = await CompetitorPrice.findByIdAndUpdate(
      id,
      { competitorPrice, competitorName },
      { new: true, runValidators: true }
    ).populate('productId', 'productName category currentPrice');

    // 4. If record not found, return 404
    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: `Competitor price record not found for ID: ${id}`,
      });
    }

    // 5. Return updated record with 200 OK
    res.status(200).json({
      success: true,
      message: 'Competitor price updated successfully',
      data: updatedRecord,
    });
  } catch (error) {
    // 6. Forward errors to centralized errorHandler
    next(error);
  }
};

/**
 * @desc    Compare our product's price against all registered competitor prices
 * @route   GET /api/competitor-prices/compare/:productId
 * @access  Public
 */
const compareProductPrices = async (req, res, next) => {
  try {
    // 1. Extract productId from URL path parameter (:productId)
    const { productId } = req.params;

    // 2. Find our product in the database
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with ID: ${productId}`,
      });
    }

    // 3. Find all competitor prices registered for this product
    const competitors = await CompetitorPrice.find({ productId });

    // 4. If no competitor prices are registered yet, return informative state
    if (competitors.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          product: {
            id: product._id,
            productName: product.productName,
            ourPrice: product.currentPrice,
          },
          competitorCount: 0,
          competitors: [],
          comparisonStatus: 'NO_COMPETITOR_DATA',
        },
      });
    }

    // 5. Extract competitor price values into a numeric array
    const prices = competitors.map((c) => c.competitorPrice);

    // 6. Calculate pricing metrics (Lowest, Highest, Average)
    const lowestCompetitorPrice = Math.min(...prices);
    const highestCompetitorPrice = Math.max(...prices);
    const averageCompetitorPrice = Number(
      (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2)
    );

    // 7. Calculate price difference (our price - lowest competitor price)
    const priceDifference = Number((product.currentPrice - lowestCompetitorPrice).toFixed(2));

    // 8. Determine comparison status (used directly by the Dynamic Pricing Engine in Phase 6!)
    let comparisonStatus = 'PRICES_MATCH';
    if (lowestCompetitorPrice < product.currentPrice) {
      // Competitor is cheaper -> Rule 3 trigger (reduce price by 5%)
      comparisonStatus = 'COMPETITOR_IS_CHEAPER';
    } else if (lowestCompetitorPrice > product.currentPrice) {
      // Competitor is more expensive -> Rule 4 trigger (increase price by 3%)
      comparisonStatus = 'COMPETITOR_IS_MORE_EXPENSIVE';
    }

    // 9. Return comprehensive comparison payload
    res.status(200).json({
      success: true,
      data: {
        product: {
          id: product._id,
          productName: product.productName,
          ourPrice: product.currentPrice,
        },
        competitorCount: competitors.length,
        lowestCompetitorPrice,
        highestCompetitorPrice,
        averageCompetitorPrice,
        priceDifference,
        comparisonStatus,
        competitors: competitors.map((c) => ({
          competitorName: c.competitorName,
          competitorPrice: c.competitorPrice,
          updatedAt: c.updatedAt,
        })),
      },
    });
  } catch (error) {
    // 10. Forward errors to centralized errorHandler
    next(error);
  }
};

module.exports = {
  addCompetitorPrice,
  getCompetitorPrices,
  updateCompetitorPrice,
  compareProductPrices,
};

