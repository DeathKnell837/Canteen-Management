const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');
const { validateStockChange } = require('../validators');
const router = express.Router();

router.use(authenticate, authorize('ADMIN', 'STAFF'));

// Get inventory levels
router.get('/', inventoryController.getAllInventory);

// Get specific item inventory
router.get('/items/:itemId', inventoryController.getInventoryStatus);

// Get low stock items
router.get('/low-stock', inventoryController.getLowStockItems);

// Add stock
router.post('/items/:itemId/stock-in', validateStockChange, inventoryController.addStock);

// Remove stock
router.post('/items/:itemId/stock-out', validateStockChange, inventoryController.removeStock);

module.exports = router;
