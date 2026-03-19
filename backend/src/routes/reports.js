const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const reportController = require('../controllers/reportController');
const { validateReportsDateQuery } = require('../validators');
const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'STAFF'));

router.get('/sales', validateReportsDateQuery, reportController.salesReport);
router.get('/inventory', validateReportsDateQuery, reportController.inventoryReport);
router.get('/transactions', validateReportsDateQuery, reportController.transactionReport);
router.get('/menu-performance', validateReportsDateQuery, reportController.menuPerformanceReport);
router.get('/customers', validateReportsDateQuery, reportController.customerReport);
router.get('/order-analytics', validateReportsDateQuery, reportController.orderAnalyticsReport);
router.get('/cash-collection', validateReportsDateQuery, reportController.cashCollectionReport);

module.exports = router;
