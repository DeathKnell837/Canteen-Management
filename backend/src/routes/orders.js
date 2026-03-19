const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const orderController = require('../controllers/orderController');
const {
	validateCreateOrder,
	validateUserOrdersQuery,
	validateOrderIdParam,
	validateOrdersListQuery,
	validateOrderStatusUpdate
} = require('../validators');
const router = express.Router();

router.use(authenticate);

// Customer routes
router.post('/', validateCreateOrder, orderController.createOrder);
router.get('/', validateUserOrdersQuery, orderController.getUserOrders);
router.get('/:orderId', validateOrderIdParam, orderController.getOrderDetail);
router.put('/:orderId/cancel', validateOrderIdParam, orderController.cancelOrder);

// Admin/Staff routes
router.put('/:orderId/status', authorize('ADMIN', 'STAFF'), validateOrderIdParam, validateOrderStatusUpdate, orderController.updateStatus);
router.get('/admin/all', authorize('ADMIN', 'STAFF'), validateOrdersListQuery, orderController.getAllOrders);
router.get('/admin/reports/summary', authorize('ADMIN', 'STAFF'), orderController.getSalesReport);

module.exports = router;
