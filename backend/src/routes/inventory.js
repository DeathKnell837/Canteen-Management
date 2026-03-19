const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');
const { validateStockChange, validateItemIdParam } = require('../validators');
const router = express.Router();

router.use(authenticate, authorize('ADMIN', 'STAFF'));

// Get inventory levels
router.get('/', inventoryController.getAllInventory);

// Get specific item inventory
router.get('/items/:itemId', validateItemIdParam, inventoryController.getInventoryStatus);

// Get low stock items
router.get('/low-stock', inventoryController.getLowStockItems);

// Add stock
router.post('/items/:itemId/stock-in', validateItemIdParam, validateStockChange, inventoryController.addStock);

// Remove stock
router.post('/items/:itemId/stock-out', validateItemIdParam, validateStockChange, inventoryController.removeStock);

module.exports = router;
