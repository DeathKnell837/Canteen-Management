const inventoryService = require('../services/inventoryService');
const { asyncHandler } = require('../utils/errorHandler');

const inventoryController = {
  getInventoryStatus: asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const inventory = await inventoryService.getInventoryStatus(parseInt(itemId));

    res.status(200).json({
      success: true,
      data: inventory
    });
  }),

  getLowStockItems: asyncHandler(async (req, res) => {
    const { threshold = 10 } = req.query;

    const items = await inventoryService.getLowStockItems(parseInt(threshold));

    res.status(200).json({
      success: true,
      data: items
    });
  }),

  addStock: asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { quantity, reason } = req.body;

    const inventory = await inventoryService.addStock(
      parseInt(itemId),
      quantity,
      reason
    );

    res.status(200).json({
      success: true,
      message: 'Stock added successfully',
      data: inventory
    });
  }),

  removeStock: asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { quantity, reason } = req.body;

    const inventory = await inventoryService.removeStock(
      parseInt(itemId),
      quantity,
      reason
    );

    res.status(200).json({
      success: true,
      message: 'Stock removed successfully',
      data: inventory
    });
  }),

  getAllInventory: asyncHandler(async (req, res) => {
    const inventory = await inventoryService.getAllInventory();

    res.status(200).json({
      success: true,
      data: inventory
    });
  }),

  deleteInventoryItem: asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    await inventoryService.deleteInventoryItem(parseInt(itemId));

    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  })
};

module.exports = inventoryController;
