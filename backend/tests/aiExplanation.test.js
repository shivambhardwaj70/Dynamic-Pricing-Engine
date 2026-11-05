const { generateExplanation } = require('../src/services/aiExplanation.service');

describe('AI Explanation Service', () => {
  it('generates a clean fallback explanation when no external API key is present', async () => {
    const explanation = await generateExplanation({
      productName: 'Gaming Keyboard',
      originalPrice: 2000,
      recommendedPrice: 2200,
      appliedRules: [
        { name: 'High Demand & Low Stock Scarcity', adjustmentPercentage: 10 },
      ],
      factorsEvaluated: {
        demand: 'HIGH',
        availableQuantity: 4,
        stockStatus: 'LOW_STOCK',
        competitorPrice: 'No Competitor Data',
      },
    });

    expect(typeof explanation).toBe('string');
    expect(explanation).toContain('Gaming Keyboard');
    expect(explanation).toContain('2200');
  });

  it('generates a stable explanation when no rules are applied', async () => {
    const explanation = await generateExplanation({
      productName: 'Office Chair',
      originalPrice: 5000,
      recommendedPrice: 5000,
      appliedRules: [],
      factorsEvaluated: {
        demand: 'NORMAL',
        availableQuantity: 40,
        stockStatus: 'NORMAL_STOCK',
        competitorPrice: 5000,
      },
    });

    expect(typeof explanation).toBe('string');
    expect(explanation).toContain('Office Chair');
    expect(explanation).toContain('stable');
  });
});

