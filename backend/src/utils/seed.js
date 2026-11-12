/**
 * backend/src/utils/seed.js
 *
 * Demo Database Seeder Script
 *
 * Purpose:
 *   Resets and seeds the MongoDB database with realistic, high-quality
 *   e-commerce catalog data, varied inventory stock distributions,
 *   competitor price feeds, and initial price recommendation history.
 *
 * Usage:
 *   cd backend
 *   npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Import Mongoose Models
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const CompetitorPrice = require('../models/CompetitorPrice');
const PriceHistory = require('../models/PriceHistory');

// Helper function to calculate stockStatus
const getStockStatus = (qty) => {
  if (qty <= 10) return 'LOW_STOCK';
  if (qty >= 100) return 'HIGH_STOCK';
  return 'NORMAL_STOCK';
};

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in backend/.env');
    }

    console.log('🔄 Connecting to MongoDB for seeding...');
    await mongoose.connect(mongoUri);
    console.log(' Connected to MongoDB Atlas.');

    // 1. Wipe existing data cleanly
    console.log(' Clearing old data from collections...');
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    await CompetitorPrice.deleteMany({});
    await PriceHistory.deleteMany({});
    console.log(' Collections purged.');

    // 2. Insert 5 Diverse Demo Products
    console.log('📦 Seeding Products...');
    const productsData = [
      {
        productName: 'Wireless Ergonomic Mouse',
        category: 'Electronics',
        currentPrice: 799,
      },
      {
        productName: 'RGB Mechanical Keyboard',
        category: 'Electronics',
        currentPrice: 2499,
      },
      {
        productName: 'Noise-Cancelling Headphones',
        category: 'Audio',
        currentPrice: 4999,
      },
      {
        productName: 'Smart Fitness Tracker Watch',
        category: 'Wearables',
        currentPrice: 3299,
      },
      {
        productName: 'Ultra-Wide 4K Gaming Monitor',
        category: 'Electronics',
        currentPrice: 18999,
      },
    ];

    const createdProducts = await Product.insertMany(productsData);
    console.log(` Inserted ${createdProducts.length} products.`);

    // Map products by name for easy reference
    const prodMap = {};
    createdProducts.forEach((p) => {
      prodMap[p.productName] = p;
    });

    // 3. Seed Inventory with a realistic distribution:
    //    - 2 Low Stock (<= 10) -> Ready to trigger Rule 1 (Scarcity Surge)
    //    - 1 High Stock (>= 100) -> Ready to trigger Rule 2 (Clearance)
    //    - 2 Normal Stock (11 - 99)
    console.log('📋 Seeding Inventory stock levels...');
    const inventoryData = [
      {
        productId: prodMap['Wireless Ergonomic Mouse']._id,
        availableQuantity: 8, // LOW_STOCK: Triggers Rule 1 when Demand is HIGH
      },
      {
        productId: prodMap['RGB Mechanical Keyboard']._id,
        availableQuantity: 135, // HIGH_STOCK: Triggers Rule 2 when Demand is LOW
      },
      {
        productId: prodMap['Noise-Cancelling Headphones']._id,
        availableQuantity: 35, // NORMAL_STOCK
      },
      {
        productId: prodMap['Smart Fitness Tracker Watch']._id,
        availableQuantity: 65, // NORMAL_STOCK
      },
      {
        productId: prodMap['Ultra-Wide 4K Gaming Monitor']._id,
        availableQuantity: 5, // LOW_STOCK
      },
    ];

    await Inventory.insertMany(inventoryData);
    console.log(' Inserted inventory records with Low, Normal, and High stock distributions.');

    // 4. Seed Competitor Prices across Amazon, Flipkart, Croma, and Reliance
    console.log('🏷️ Seeding Competitor Price feeds...');
    const competitorData = [
      // Mouse: Amazon is cheaper (₹749 < ₹799 -> Rule 3), Flipkart is pricier (₹849 > ₹799 -> Rule 4)
      {
        productId: prodMap['Wireless Ergonomic Mouse']._id,
        competitorName: 'Amazon',
        competitorPrice: 749,
      },
      {
        productId: prodMap['Wireless Ergonomic Mouse']._id,
        competitorName: 'Flipkart',
        competitorPrice: 849,
      },

      // Keyboard: Amazon is pricier (₹2699 > ₹2499), Croma is cheaper (₹2399 < ₹2499)
      {
        productId: prodMap['RGB Mechanical Keyboard']._id,
        competitorName: 'Amazon',
        competitorPrice: 2699,
      },
      {
        productId: prodMap['RGB Mechanical Keyboard']._id,
        competitorName: 'Croma',
        competitorPrice: 2399,
      },

      // Headphones: Amazon is cheaper (₹4699), Reliance is pricier (₹5299)
      {
        productId: prodMap['Noise-Cancelling Headphones']._id,
        competitorName: 'Amazon',
        competitorPrice: 4699,
      },
      {
        productId: prodMap['Noise-Cancelling Headphones']._id,
        competitorName: 'Reliance Digital',
        competitorPrice: 5299,
      },

      // Smart Watch: Flipkart is cheaper (₹3099), Amazon matches (₹3299)
      {
        productId: prodMap['Smart Fitness Tracker Watch']._id,
        competitorName: 'Flipkart',
        competitorPrice: 3099,
      },
      {
        productId: prodMap['Smart Fitness Tracker Watch']._id,
        competitorName: 'Amazon',
        competitorPrice: 3299,
      },

      // 4K Monitor: Amazon is pricier (₹19999 > ₹18999 -> Rule 4)
      {
        productId: prodMap['Ultra-Wide 4K Gaming Monitor']._id,
        competitorName: 'Amazon',
        competitorPrice: 19999,
      },
    ];

    await CompetitorPrice.insertMany(competitorData);
    console.log(` Inserted ${competitorData.length} competitor price feeds.`);

    // 5. Seed Historical Price Adjustments (So Recharts telemetry displays curves immediately)
    console.log('📈 Seeding Price History audit logs for charts...');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;

    const historyData = [
      // Mouse history points
      {
        productId: prodMap['Wireless Ergonomic Mouse']._id,
        oldPrice: 799,
        recommendedPrice: 838.95,
        reason: 'High Demand & Low Stock Scarcity (+10%) | Competitor Price Under-Cut Defense (-5%)',
        aiExplanation:
          'The recommended price for Wireless Ergonomic Mouse is ₹838.95 (+5%) because high market demand and low stock (8 units) triggered a 10% scarcity surge, tempered by a 5% discount to stay competitive with Amazon (₹749).',
        appliedRules: [
          { rule: 'RULE_1', name: 'High Demand & Low Stock Scarcity', adjustmentPercentage: 10 },
          { rule: 'RULE_3', name: 'Competitor Price Under-Cut Defense', adjustmentPercentage: -5 },
        ],
        createdAt: new Date(now - 2 * oneDay - 4 * oneHour),
      },
      {
        productId: prodMap['Wireless Ergonomic Mouse']._id,
        oldPrice: 799,
        recommendedPrice: 878.90,
        reason: 'High Demand & Low Stock Scarcity (+10%)',
        aiExplanation:
          'The price was increased by 10% to ₹878.90 to maximize gross margin during high consumer search traffic while warehouse stock remains at critical scarcity levels (8 units).',
        appliedRules: [
          { rule: 'RULE_1', name: 'High Demand & Low Stock Scarcity', adjustmentPercentage: 10 },
        ],
        createdAt: new Date(now - 1 * oneDay - 2 * oneHour),
      },
      {
        productId: prodMap['Wireless Ergonomic Mouse']._id,
        oldPrice: 799,
        recommendedPrice: 759.05,
        reason: 'Competitor Price Under-Cut Defense (-5%)',
        aiExplanation:
          'Under normal market demand, the price was reduced by 5% to ₹759.05 to defend against Amazon selling at ₹749.',
        appliedRules: [
          { rule: 'RULE_3', name: 'Competitor Price Under-Cut Defense', adjustmentPercentage: -5 },
        ],
        createdAt: new Date(now - 3 * oneHour),
      },

      // Keyboard history points
      {
        productId: prodMap['RGB Mechanical Keyboard']._id,
        oldPrice: 2499,
        recommendedPrice: 2249.10,
        reason: 'Low Demand & High Stock Clearance (-10%)',
        aiExplanation:
          'Surplus warehouse inventory (135 units) combined with low consumer demand triggered a 10% clearance markdown to stimulate sales velocity.',
        appliedRules: [
          { rule: 'RULE_2', name: 'Low Demand & High Stock Clearance', adjustmentPercentage: -10 },
        ],
        createdAt: new Date(now - 1 * oneDay),
      },
      {
        productId: prodMap['RGB Mechanical Keyboard']._id,
        oldPrice: 2499,
        recommendedPrice: 2573.97,
        reason: 'Competitor Premium Advantage (+3%)',
        aiExplanation:
          'Amazon is selling at ₹2699. A 3% margin expansion was applied while maintaining a ₹125 price advantage over Amazon.',
        appliedRules: [
          { rule: 'RULE_4', name: 'Competitor Premium Advantage', adjustmentPercentage: 3 },
        ],
        createdAt: new Date(now - 2 * oneHour),
      },

      // Headphones history points
      {
        productId: prodMap['Noise-Cancelling Headphones']._id,
        oldPrice: 4999,
        recommendedPrice: 4749.05,
        reason: 'Competitor Price Under-Cut Defense (-5%)',
        aiExplanation:
          'Competitor price on Amazon is ₹4699. Reduced catalog base price by 5% to stay competitive.',
        appliedRules: [
          { rule: 'RULE_3', name: 'Competitor Price Under-Cut Defense', adjustmentPercentage: -5 },
        ],
        createdAt: new Date(now - 6 * oneHour),
      },
    ];

    await PriceHistory.insertMany(historyData);
    console.log(` Inserted ${historyData.length} historical price audit records.`);

    console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('----------------------------------------------------');
    console.log('• 5 Products');
    console.log('• 5 Inventory records (Low Stock: 2, High Stock: 1, Normal: 2)');
    console.log('• 9 Competitor feeds (Amazon, Flipkart, Croma, Reliance)');
    console.log('• 6 Historical price recommendation audit records');
    console.log('----------------------------------------------------\n');

    await mongoose.disconnect();
    console.log(' Disconnected from MongoDB cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedDatabase();

