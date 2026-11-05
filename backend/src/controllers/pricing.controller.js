const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const CompetitorPrice = require('../models/CompetitorPrice');
const PriceHistory = require('../models/PriceHistory');
const pricingEngineService = require('../services/pricingEngine.service');
const aiExplanationService = require('../services/aiExplanation.service');

/**
 * @desc    Calculate recommended dynamic price, generate AI explanation, and log to history
 * @route   POST /api/pricing/calculate-price
 * @access  Public
 */
const calculateRecommendedPrice = async (req, res, next) => {
  try {
    // 1. Extract input parameters from request body
    const { productId, demand, manualCompetitorPrice, manualStockQuantity } = req.body;

    // 2. Validate that productId is provided
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required to calculate dynamic pricing',
      });
    }

    // 3. Fetch product from database to get its base/current price
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with ID: ${productId}`,
      });
    }

    // 4. Fetch live inventory count for this product
    const inventory = await Inventory.findOne({ productId });
    const availableQuantity =
      manualStockQuantity !== undefined
        ? Number(manualStockQuantity)
        : inventory
        ? inventory.availableQuantity
        : 50;

    // 5. Fetch competitor prices to determine the lowest competitor price
    const competitorRecords = await CompetitorPrice.find({ productId });
    let competitorPrice = null;

    if (manualCompetitorPrice !== undefined) {
      competitorPrice = Number(manualCompetitorPrice);
    } else if (competitorRecords.length > 0) {
      // Find the cheapest competitor price in the market
      competitorPrice = Math.min(...competitorRecords.map((c) => c.competitorPrice));
    }

    // 6. Pass gathered parameters into the Rule-Based Pricing Engine Service
    const pricingResult = pricingEngineService.calculatePrice({
      currentPrice: product.currentPrice,
      demand: demand || 'NORMAL',
      availableQuantity,
      competitorPrice,
    });

    // 7. Compose a concise rule reason summary
    const reason =
      pricingResult.appliedRules.length > 0
        ? pricingResult.appliedRules
            .map(
              (r) =>
                `${r.name} (${r.adjustmentPercentage > 0 ? '+' : ''}${r.adjustmentPercentage}%)`
            )
            .join(' | ')
        : 'Market conditions stable; base price maintained';

    // 8. Generate natural language AI explanation using Gemini / OpenAI (or fallback)
    // NOTE: AI explains the rule-engine results; AI DOES NOT calculate the price!
    const aiExplanation = await aiExplanationService.generateExplanation({
      productName: product.productName,
      originalPrice: product.currentPrice,
      recommendedPrice: pricingResult.recommendedPrice,
      appliedRules: pricingResult.appliedRules,
      factorsEvaluated: pricingResult.factorsEvaluated,
    });

    // 9. Persist the recommendation in the PriceHistory collection (Audit Trail)
    const historyEntry = await PriceHistory.create({
      productId: product._id,
      oldPrice: product.currentPrice,
      recommendedPrice: pricingResult.recommendedPrice,
      reason,
      aiExplanation,
      appliedRules: pricingResult.appliedRules.map((r) => ({
        rule: r.rule,
        name: r.name,
        adjustmentPercentage: r.adjustmentPercentage,
      })),
    });

    // 10. Return complete pricing response with AI explanation and history ID
    res.status(200).json({
      success: true,
      message: 'Dynamic price calculated and explained successfully',
      data: {
        product: {
          id: product._id,
          productName: product.productName,
          category: product.category,
        },
        historyId: historyEntry._id,
        reasonSummary: reason,
        aiExplanation,
        ...pricingResult,
      },
    });
  } catch (error) {
    // 11. Forward errors to centralized errorHandler
    next(error);
  }
};

/**
 * @desc    Get pricing history records (optionally filter by ?productId=... or /history/:productId)
 * @route   GET /api/pricing/history
 * @route   GET /api/pricing/history/:productId
 * @route   GET /api/pricing-history
 * @access  Public
 */
const getPricingHistory = async (req, res, next) => {
  try {
    // 1. Support productId from either route params (:productId) or query string (?productId=...)
    const productId = req.params.productId || req.query.productId;
    const filter = productId ? { productId } : {};

    // 2. Fetch history records matching filter, sorted from newest to oldest (-1)
    const historyList = await PriceHistory.find(filter)
      .populate('productId', 'productName category currentPrice')
      .sort({ createdAt: -1 });

    // 3. Return response with 200 OK
    res.status(200).json({
      success: true,
      count: historyList.length,
      data: historyList,
    });
  } catch (error) {
    // 4. Forward errors to centralized errorHandler
    next(error);
  }
};

module.exports = {
  calculateRecommendedPrice,
  getPricingHistory,
};
