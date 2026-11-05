const { calculatePrice } = require('../src/services/pricingEngine.service');

describe('Dynamic Pricing Engine Service (Rule Engine)', () => {
  const BASE_PRICE = 1000;

  describe('Rule 1: High Demand & Low Inventory (+10%)', () => {
    it('increases price by 10% when demand is HIGH and stock <= 10', () => {
      const result = calculatePrice({
        currentPrice: BASE_PRICE,
        demand: 'HIGH',
        availableQuantity: 5,
        competitorPrice: null,
      });

      expect(result.recommendedPrice).toBe(1100);
      expect(result.totalPercentageAdjustment).toBe('+10%');
      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].rule).toBe('RULE_1');
    });
  });

  describe('Rule 2: Low Demand & High Inventory (-10%)', () => {
    it('decreases price by 10% when demand is LOW and stock >= 100', () => {
      const result = calculatePrice({
        currentPrice: BASE_PRICE,
        demand: 'LOW',
        availableQuantity: 150,
        competitorPrice: null,
      });

      expect(result.recommendedPrice).toBe(900);
      expect(result.totalPercentageAdjustment).toBe('-10%');
      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].rule).toBe('RULE_2');
    });
  });

  describe('Rule 3: Competitor Price is Lower (-5%)', () => {
    it('reduces price by 5% when competitor price is lower than ours', () => {
      const result = calculatePrice({
        currentPrice: BASE_PRICE,
        demand: 'NORMAL',
        availableQuantity: 50,
        competitorPrice: 900, // Cheaper than 1000
      });

      expect(result.recommendedPrice).toBe(950);
      expect(result.totalPercentageAdjustment).toBe('-5%');
      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].rule).toBe('RULE_3');
    });
  });

  describe('Rule 4: Competitor Price is Higher (+3%)', () => {
    it('increases price by 3% when competitor price is higher than ours', () => {
      const result = calculatePrice({
        currentPrice: BASE_PRICE,
        demand: 'NORMAL',
        availableQuantity: 50,
        competitorPrice: 1200, // More expensive than 1000
      });

      expect(result.recommendedPrice).toBe(1030);
      expect(result.totalPercentageAdjustment).toBe('+3%');
      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].rule).toBe('RULE_4');
    });
  });

  describe('Combined Rules Evaluation', () => {
    it('combines Rule 1 (+10%) and Rule 3 (-5%) to produce net +5%', () => {
      const result = calculatePrice({
        currentPrice: BASE_PRICE,
        demand: 'HIGH',
        availableQuantity: 5, // Rule 1 triggers (+10%)
        competitorPrice: 950, // Rule 3 triggers (-5%)
      });

      expect(result.recommendedPrice).toBe(1050);
      expect(result.totalPercentageAdjustment).toBe('+5%');
      expect(result.appliedRules).toHaveLength(2);
    });

    it('combines Rule 1 (+10%) and Rule 4 (+3%) to produce net +13%', () => {
      const result = calculatePrice({
        currentPrice: BASE_PRICE,
        demand: 'HIGH',
        availableQuantity: 8, // Rule 1 triggers (+10%)
        competitorPrice: 1100, // Rule 4 triggers (+3%)
      });

      expect(result.recommendedPrice).toBe(1130);
      expect(result.totalPercentageAdjustment).toBe('+13%');
      expect(result.appliedRules).toHaveLength(2);
    });
  });

  describe('Safety Guardrails (Boundary Limits)', () => {
    it('does not allow price to drop below 50% of current price', () => {
      const result = calculatePrice({
        currentPrice: 100,
        demand: 'LOW',
        availableQuantity: 500,
        competitorPrice: 10,
      });

      expect(result.recommendedPrice).toBeGreaterThanOrEqual(50);
    });

    it('does not allow price to exceed 200% of current price', () => {
      const result = calculatePrice({
        currentPrice: 100,
        demand: 'HIGH',
        availableQuantity: 1,
        competitorPrice: 500,
      });

      expect(result.recommendedPrice).toBeLessThanOrEqual(200);
    });
  });
});

