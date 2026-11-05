/**
 * AI Explanation Service
 * Generates natural language explanations for rule-based pricing decisions.
 *
 * CRITICAL ARCHITECTURAL PRINCIPLE (As per project specification):
 * - The rule-based engine decides the price (deterministic math).
 * - The AI only EXPLAINS the decision to the store manager.
 * - AI must NEVER independently calculate or alter product prices.
 */

/**
 * Generates a rule-based fallback explanation when no AI API key is configured or API is unreachable.
 */
const generateFallbackExplanation = ({
  productName,
  originalPrice,
  recommendedPrice,
  appliedRules,
  factorsEvaluated,
}) => {
  if (!appliedRules || appliedRules.length === 0) {
    return `The price for ${productName} is maintained at ₹${recommendedPrice} because demand, stock, and competitor conditions are stable.`;
  }

  const ruleDescriptions = appliedRules.map((r) => r.name).join(' and ');
  return `The recommended price for ${productName} is ₹${recommendedPrice} (adjusted from ₹${originalPrice}) because ${ruleDescriptions.toLowerCase()} conditions were detected.`;
};

/**
 * Generates an AI-assisted explanation using Google Gemini or OpenAI.
 * Automatically falls back to template explanation if no API key is provided or network fails.
 *
 * @param {Object} params
 * @param {string} params.productName - Name of the product
 * @param {number} params.originalPrice - Starting base price
 * @param {number} params.recommendedPrice - Rule-engine calculated price
 * @param {Array} params.appliedRules - List of triggered business rules
 * @param {Object} params.factorsEvaluated - Market conditions evaluated
 * @returns {Promise<string>} Plain-text explanation
 */
const generateExplanation = async ({
  productName,
  originalPrice,
  recommendedPrice,
  appliedRules = [],
  factorsEvaluated = {},
}) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

  // If no AI key is provided, use the deterministic fallback explanation
  if (!geminiApiKey && !openaiApiKey) {
    return generateFallbackExplanation({
      productName,
      originalPrice,
      recommendedPrice,
      appliedRules,
      factorsEvaluated,
    });
  }

  // Construct a strict, grounded prompt for the AI
  const prompt = `You are an e-commerce pricing analyst.
A rule-based pricing engine has already calculated the optimal price.
Your ONLY job is to explain the decision in 1 to 2 concise, professional sentences.
Do NOT calculate or suggest a different price. Strictly explain the given numbers.

Product: ${productName}
Original Price: ₹${originalPrice}
Recommended Price: ₹${recommendedPrice}
Market Demand: ${factorsEvaluated.demand || 'NORMAL'}
Inventory Level: ${factorsEvaluated.availableQuantity} units (${factorsEvaluated.stockStatus || 'NORMAL'})
Competitor Price: ${factorsEvaluated.competitorPrice}
Triggered Rules: ${appliedRules.map((r) => `${r.name} (${r.adjustmentPercentage}%)`).join(', ') || 'None'}

Output only the 1-2 sentence explanation:`;

  try {
    // -------------------------------------------------------------
    // Option A: Google Gemini API (Default)
    // -------------------------------------------------------------
    if (geminiApiKey && provider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 100,
              temperature: 0.3, // Low temperature for factual, consistent explanations
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      const explanation = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (explanation) {
        return explanation.trim();
      }
    }

    // -------------------------------------------------------------
    // Option B: OpenAI API
    // -------------------------------------------------------------
    if (openaiApiKey && provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an e-commerce pricing analyst explaining rule-based dynamic pricing decisions.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 100,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      const explanation = data?.choices?.[0]?.message?.content;
      if (explanation) {
        return explanation.trim();
      }
    }
  } catch (error) {
    console.warn(`[AI Explanation Warning]: ${error.message}. Using fallback explanation.`);
  }

  // Graceful fallback if AI call fails or key is invalid
  return generateFallbackExplanation({
    productName,
    originalPrice,
    recommendedPrice,
    appliedRules,
    factorsEvaluated,
  });
};

module.exports = {
  generateExplanation,
};

