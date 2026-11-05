/**
 * Dynamic Pricing Engine Service
 * Contains pure mathematical business logic and rule evaluations.
 * Independent of HTTP requests and database queries.
 *
 * Rules as defined in project specification:
 * - Rule 1: If demand is HIGH and inventory is LOW  -> Increase price by 10%
 * - Rule 2: If demand is LOW and inventory is HIGH  -> Decrease price by 10%
 * - Rule 3: If competitor price is LOWER than ours  -> Reduce price by 5%
 * - Rule 4: If competitor price is HIGHER than ours -> Increase price by 3%
 */

/**
 * Calculates recommended price by evaluating business rules.
 * @param {Object} params
 * @param {number} params.currentPrice - Our current product base price
 * @param {string} params.demand - 'HIGH' | 'LOW' | 'NORMAL'
 * @param {number} params.availableQuantity - Current stock count
 * @param {number|null} params.competitorPrice - Lowest competitor price (or null)
 * @returns {Object} Detailed calculation results including applied rules and final price
 */
const calculatePrice = ({ currentPrice, demand = 'NORMAL', availableQuantity = 50, competitorPrice = null }) => {
  // Normalize inputs
  const normalizedDemand = demand ? demand.toUpperCase() : 'NORMAL';
  const isLowStock = availableQuantity <= 10;
  const isHighStock = availableQuantity >= 100;

  const appliedRules = [];
  let totalPercentageAdjustment = 0;

  // -------------------------------------------------------------
  // RULE 1: High Demand + Low Stock (Surge / Scarcity)
  // -------------------------------------------------------------
  if (normalizedDemand === 'HIGH' && isLowStock) {
    totalPercentageAdjustment += 10;
    appliedRules.push({
      rule: 'RULE_1',
      name: 'High Demand & Low Stock Scarcity',
      adjustmentPercentage: +10,
      description: 'Demand is high and stock is low (<= 10 units); price increased by 10% to maximize profit.',
    });
  }

  // -------------------------------------------------------------
  // RULE 2: Low Demand + High Stock (Inventory Clearance)
  // -------------------------------------------------------------
  else if (normalizedDemand === 'LOW' && isHighStock) {
    totalPercentageAdjustment -= 10;
    appliedRules.push({
      rule: 'RULE_2',
      name: 'Low Demand & High Stock Clearance',
      adjustmentPercentage: -10,
      description: 'Demand is low and inventory is surplus (>= 100 units); price reduced by 10% to clear stock.',
    });
  }

  // -------------------------------------------------------------
  // RULE 3 & RULE 4: Competitor-Based Price Matching
  // -------------------------------------------------------------
  if (competitorPrice !== null && competitorPrice !== undefined && competitorPrice > 0) {
    if (competitorPrice < currentPrice) {
      // RULE 3: Competitor is cheaper -> Drop price to stay competitive
      totalPercentageAdjustment -= 5;
      appliedRules.push({
        rule: 'RULE_3',
        name: 'Competitor Price Under-Cut Defense',
        adjustmentPercentage: -5,
        description: `Competitor price (₹${competitorPrice}) is cheaper than our price (₹${currentPrice}); reduced price by 5% to stay competitive.`,
      });
    } else if (competitorPrice > currentPrice) {
      // RULE 4: Competitor is more expensive -> Opportunity to increase margin
      totalPercentageAdjustment += 3;
      appliedRules.push({
        rule: 'RULE_4',
        name: 'Competitor Premium Advantage',
        adjustmentPercentage: +3,
        description: `Competitor price (₹${competitorPrice}) is higher than our price (₹${currentPrice}); increased price by 3% while remaining attractive.`,
      });
    }
  }

  // -------------------------------------------------------------
  // Calculate Raw Recommended Price
  // Formula: recommendedPrice = currentPrice * (1 + totalAdjustment / 100)
  // -------------------------------------------------------------
  let calculatedPrice = currentPrice * (1 + totalPercentageAdjustment / 100);

  // Safety Guardrails: Prevent price from dropping below 50% or exceeding 200% of current price
  const minAllowedPrice = Number((currentPrice * 0.5).toFixed(2));
  const maxAllowedPrice = Number((currentPrice * 2.0).toFixed(2));

  if (calculatedPrice < minAllowedPrice) {
    calculatedPrice = minAllowedPrice;
  } else if (calculatedPrice > maxAllowedPrice) {
    calculatedPrice = maxAllowedPrice;
  }

  // Round final price to 2 decimal places
  const recommendedPrice = Math.round(calculatedPrice * 100) / 100;
  const netChange = Math.round((recommendedPrice - currentPrice) * 100) / 100;

  return {
    originalPrice: currentPrice,
    recommendedPrice,
    netChange,
    totalPercentageAdjustment: `${totalPercentageAdjustment > 0 ? '+' : ''}${totalPercentageAdjustment}%`,
    appliedRulesCount: appliedRules.length,
    appliedRules,
    factorsEvaluated: {
      demand: normalizedDemand,
      availableQuantity,
      stockStatus: isLowStock ? 'LOW_STOCK' : isHighStock ? 'HIGH_STOCK' : 'NORMAL_STOCK',
      competitorPrice: competitorPrice !== null ? competitorPrice : 'No Competitor Data',
    },
  };
};

module.exports = {
  calculatePrice,
};

