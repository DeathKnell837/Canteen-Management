const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const orderController = require('../controllers/orderController');
const { validateCreateOrder } = require('../validators');
const router = express.Router();

router.use(authenticate);

// Customer routes
router.post('/', validateCreateOrder, orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:orderId', orderController.getOrderDetail);
router.put('/:orderId/cancel', orderController.cancelOrder);

// Admin/Staff routes
router.put('/:orderId/status', authorize('ADMIN', 'STAFF'), orderController.updateStatus);
router.get('/admin/all', authorize('ADMIN', 'STAFF'), orderController.getAllOrders);
router.get('/admin/reports/summary', authorize('ADMIN', 'STAFF'), orderController.getSalesReport);

module.exports = router;
