const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

/**
 * Helper function to determine stock status based on inventory thresholds.
 * - Low stock: <= 10 units (signals scarcity -> price may increase)
 * - High stock: >= 100 units (signals excess inventory -> price may decrease)
 * - Normal stock: between 11 and 99 units
 * @param {number} quantity - Available inventory count
 * @returns {string} - 'LOW_STOCK' | 'HIGH_STOCK' | 'NORMAL_STOCK'
 */
const calculateStockStatus = (quantity) => {
  if (quantity <= 10) return 'LOW_STOCK';
  if (quantity >= 100) return 'HIGH_STOCK';
  return 'NORMAL_STOCK';
};

/**
 * @desc    Add initial inventory for a product
 * @route   POST /api/inventory
 * @access  Public (Admin)
 */
const addInventory = async (req, res, next) => {
  try {
    // 1. Extract productId and availableQuantity from request body
    const { productId, availableQuantity } = req.body;

    // 2. Validate that the referenced product actually exists in the Products collection
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Cannot create inventory: Product not found with ID ${productId}`,
      });
    }

    // 3. Check if an inventory record already exists for this product (1-to-1 relationship)
    const existingInventory = await Inventory.findOne({ productId });
    if (existingInventory) {
      return res.status(400).json({
        success: false,
        message: 'Inventory record already exists for this product. Use PUT /api/inventory/:id to update stock.',
      });
    }

    // 4. Create the new inventory record in MongoDB
    const inventory = await Inventory.create({
      productId,
      availableQuantity: availableQuantity !== undefined ? availableQuantity : 0,
    });

    // 5. Populate product details (productName, category, currentPrice) to send a complete response
    await inventory.populate('productId', 'productName category currentPrice');

    // 6. Return response with 201 Created and calculated stock status
    res.status(201).json({
      success: true,
      message: 'Inventory record created successfully',
      data: {
        ...inventory.toObject(),
        stockStatus: calculateStockStatus(inventory.availableQuantity),
      },
    });
  } catch (error) {
    // 7. Passes any database or validation errors to centralized errorHandler
    next(error);
  }
};

/**
 * @desc    Get all inventory records (optionally filter by ?status=low or ?status=high)
 * @route   GET /api/inventory
 * @access  Public
 */
const getAllInventory = async (req, res, next) => {
  try {
    // 1. Fetch all inventory records from MongoDB and populate product details
    const inventoryList = await Inventory.find()
      .populate('productId', 'productName category currentPrice')
      .sort({ updatedAt: -1 });

    // 2. Attach computed stockStatus ('LOW_STOCK', 'HIGH_STOCK', 'NORMAL_STOCK') to each item
    const formattedInventory = inventoryList.map((item) => ({
      ...item.toObject(),
      stockStatus: calculateStockStatus(item.availableQuantity),
    }));

    // 3. Check for optional query filter: ?status=low or ?status=high
    const { status } = req.query;
    let filteredList = formattedInventory;

    if (status) {
      const upperStatus = status.toUpperCase();
      if (upperStatus === 'LOW') {
        filteredList = formattedInventory.filter((item) => item.stockStatus === 'LOW_STOCK');
      } else if (upperStatus === 'HIGH') {
        filteredList = formattedInventory.filter((item) => item.stockStatus === 'HIGH_STOCK');
      }
    }

    // 4. Send response with 200 OK
    res.status(200).json({
      success: true,
      count: filteredList.length,
      data: filteredList,
    });
  } catch (error) {
    // 5. Forward errors to centralized errorHandler
    next(error);
  }
};

/**
 * @desc    Update stock quantity for a product
 * @route   PUT /api/inventory/:id
 * @access  Public (Admin)
 */
const updateStock = async (req, res, next) => {
  try {
    // 1. Extract identifier from URL path parameter (:id)
    const { id } = req.params;

    // 2. Extract new availableQuantity from request body
    const { availableQuantity } = req.body;

    // 3. Validate that quantity is provided and is a valid number
    if (availableQuantity === undefined || availableQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Available quantity is required and cannot be negative',
      });
    }

    // 4. Find inventory record by either its own _id OR the referenced productId
    // This allows clients to update stock using either the Inventory ID or the Product ID!
    let inventory = await Inventory.findById(id);
    if (!inventory) {
      inventory = await Inventory.findOne({ productId: id });
    }

    // 5. If no record is found with that ID, return 404 Not Found
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: `Inventory record not found for ID: ${id}`,
      });
    }

    // 6. Update the quantity and save the document
    inventory.availableQuantity = availableQuantity;
    await inventory.save();

    // 7. Populate product details for the response
    await inventory.populate('productId', 'productName category currentPrice');

    // 8. Return updated inventory with HTTP 200 OK
    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        ...inventory.toObject(),
        stockStatus: calculateStockStatus(inventory.availableQuantity),
      },
    });
  } catch (error) {
    // 9. Forward errors to centralized errorHandler
    next(error);
  }
};

module.exports = {
  addInventory,
  getAllInventory,
  updateStock,
};

