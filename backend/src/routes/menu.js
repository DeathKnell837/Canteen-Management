const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const menuController = require('../controllers/menuController');
const { validateMenuItem } = require('../validators');
const router = express.Router();

// Public routes - anyone can view menu
router.get('/categories', menuController.getCategories);
router.get('/search', menuController.searchItems);
router.get('/items', menuController.getItems);
router.get('/items/:itemId', menuController.getItemDetail);

// Admin/Staff routes - menu management
router.post('/items', authenticate, authorize('ADMIN', 'STAFF'), validateMenuItem, menuController.createItem);
router.put('/items/:itemId', authenticate, authorize('ADMIN', 'STAFF'), validateMenuItem, menuController.updateItem);
router.delete('/items/:itemId', authenticate, authorize('ADMIN'), menuController.deleteItem);

module.exports = router;
