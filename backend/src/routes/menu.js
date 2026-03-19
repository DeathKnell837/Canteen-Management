const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const menuController = require('../controllers/menuController');
const {
	validateMenuItem,
	validateMenuItemUpdate,
	validateItemIdParam,
	validateCategoryIdParam,
	validateCategoryCreate,
	validateCategoryUpdate
} = require('../validators');
const upload = require('../middleware/upload');
const router = express.Router();

// Public routes - anyone can view menu
router.get('/categories', menuController.getCategories);
router.get('/search', menuController.searchItems);
router.get('/items', menuController.getItems);
router.get('/items/:itemId', validateItemIdParam, menuController.getItemDetail);

// Admin/Staff routes - menu management
router.post('/items', authenticate, authorize('ADMIN', 'STAFF'), validateMenuItem, menuController.createItem);
router.put('/items/:itemId', authenticate, authorize('ADMIN', 'STAFF'), validateItemIdParam, validateMenuItemUpdate, menuController.updateItem);
router.delete('/items/:itemId', authenticate, authorize('ADMIN'), validateItemIdParam, menuController.deleteItem);

// Image upload route
router.post('/items/:itemId/image', authenticate, authorize('ADMIN', 'STAFF'), validateItemIdParam, upload.single('image'), menuController.uploadImage);

// Category CRUD (admin only)
router.post('/categories', authenticate, authorize('ADMIN', 'STAFF'), validateCategoryCreate, menuController.createCategory);
router.put('/categories/:categoryId', authenticate, authorize('ADMIN', 'STAFF'), validateCategoryIdParam, validateCategoryUpdate, menuController.updateCategory);
router.delete('/categories/:categoryId', authenticate, authorize('ADMIN'), validateCategoryIdParam, menuController.deleteCategory);

module.exports = router;
