const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/errorHandler');

// Helper to build date conditions
function dateConditions(startDate, endDate, dateCol, params) {
  const conds = [];
  if (startDate) { params.push(startDate); conds.push(`${dateCol} >= $${params.length}`); }
  if (endDate) { params.push(endDate); conds.push(`${dateCol} <= $${params.length}`); }
  return conds;
}

const reportController = {
  // 1. SALES REPORT
  salesReport: asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const params = []; const conds = dateConditions(startDate, endDate, 'o.created_at', params);
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const [summaryRes, dailyRes] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::INT AS total_orders,
               COUNT(*) FILTER (WHERE o.status <> 'CANCELLED')::INT AS successful_orders,
               COALESCE(SUM(o.total_amount) FILTER (WHERE o.status <> 'CANCELLED'), 0)::DECIMAL(10,2) AS total_revenue,
               COALESCE(AVG(o.total_amount) FILTER (WHERE o.status <> 'CANCELLED'), 0)::DECIMAL(10,2) AS avg_order_value
        FROM orders o ${where}`, params),
      pool.query(`
        SELECT DATE(o.created_at) AS date,
               COUNT(*)::INT AS orders,
               COALESCE(SUM(o.total_amount) FILTER (WHERE o.status <> 'CANCELLED'), 0)::DECIMAL(10,2) AS revenue
        FROM orders o ${where}
        GROUP BY DATE(o.created_at)
        ORDER BY date DESC LIMIT 30`, [...params])
    ]);

    res.json({ success: true, data: { summary: summaryRes.rows[0], daily: dailyRes.rows } });
  }),

  // 2. INVENTORY REPORT
  inventoryReport: asyncHandler(async (req, res) => {
    const [stockRes, lowStockRes] = await Promise.all([
      pool.query(`
        SELECT m.item_id, m.name, mc.name AS category, i.quantity_available, i.reorder_level,
               CASE WHEN i.quantity_available <= i.reorder_level THEN true ELSE false END AS is_low_stock,
               i.updated_at AS last_updated
        FROM menu_items m
        JOIN inventory i ON m.item_id = i.item_id
        LEFT JOIN menu_categories mc ON m.category_id = mc.category_id
        WHERE m.is_active = true
        ORDER BY i.quantity_available ASC`),
      pool.query(`
        SELECT COUNT(*)::INT AS low_stock_count
        FROM menu_items m JOIN inventory i ON m.item_id = i.item_id
        WHERE m.is_active = true AND i.quantity_available <= i.reorder_level`)
    ]);

    res.json({
      success: true,
      data: {
        items: stockRes.rows,
        low_stock_count: lowStockRes.rows[0].low_stock_count,
        total_items: stockRes.rows.length
      }
    });
  }),

  // 3. TRANSACTION REPORT
  transactionReport: asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const params = []; const conds = dateConditions(startDate, endDate, 'wt.created_at', params);
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const [txRes, methodRes, summaryRes] = await Promise.all([
      pool.query(`
        SELECT wt.transaction_id, wt.amount, wt.transaction_type, wt.description, wt.balance_after, wt.created_at,
               u.full_name AS customer_name
        FROM wallet_transactions wt
        JOIN users u ON wt.user_id = u.user_id
        ${where}
        ORDER BY wt.created_at DESC LIMIT 100`, params),
      pool.query(`
        SELECT wt.transaction_type,
               COUNT(*)::INT AS count,
               COALESCE(SUM(ABS(wt.amount)), 0)::DECIMAL(10,2) AS total
        FROM wallet_transactions wt ${where}
        GROUP BY wt.transaction_type`, [...params]),
      pool.query(`
        SELECT COALESCE(SUM(ABS(amount)) FILTER (WHERE transaction_type = 'TOPUP'), 0)::DECIMAL(10,2) AS total_topups,
               COALESCE(SUM(ABS(amount)) FILTER (WHERE transaction_type = 'PURCHASE'), 0)::DECIMAL(10,2) AS total_purchases,
               COUNT(*)::INT AS total_transactions
        FROM wallet_transactions wt ${where}`, [...params])
    ]);

    res.json({ success: true, data: { transactions: txRes.rows, byMethod: methodRes.rows, summary: summaryRes.rows[0] } });
  }),

  // 4. MENU PERFORMANCE
  menuPerformanceReport: asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const params = []; const conds = dateConditions(startDate, endDate, 'o.created_at', params);
    const orderWhere = conds.length ? 'AND ' + conds.join(' AND ') : '';

    const [bestRes, worstRes, catRes, neverRes] = await Promise.all([
      pool.query(`
        SELECT m.item_id, m.name, mc.name AS category,
               COALESCE(SUM(oi.quantity), 0)::INT AS units_sold,
               COALESCE(SUM(oi.subtotal), 0)::DECIMAL(10,2) AS revenue
        FROM menu_items m
        LEFT JOIN order_items oi ON m.item_id = oi.item_id
        LEFT JOIN orders o ON oi.order_id = o.order_id AND o.status <> 'CANCELLED' ${orderWhere}
        LEFT JOIN menu_categories mc ON m.category_id = mc.category_id
        WHERE m.is_active = true
        GROUP BY m.item_id, m.name, mc.name
        ORDER BY units_sold DESC LIMIT 10`, params),
      pool.query(`
        SELECT m.item_id, m.name, mc.name AS category,
               COALESCE(SUM(oi.quantity), 0)::INT AS units_sold
        FROM menu_items m
        LEFT JOIN order_items oi ON m.item_id = oi.item_id
        LEFT JOIN orders o ON oi.order_id = o.order_id AND o.status <> 'CANCELLED' ${orderWhere}
        LEFT JOIN menu_categories mc ON m.category_id = mc.category_id
        WHERE m.is_active = true
        GROUP BY m.item_id, m.name, mc.name
        HAVING COALESCE(SUM(oi.quantity), 0) > 0
        ORDER BY units_sold ASC LIMIT 10`, [...params]),
      pool.query(`
        SELECT mc.name AS category,
               COALESCE(SUM(oi.subtotal), 0)::DECIMAL(10,2) AS revenue,
               COALESCE(SUM(oi.quantity), 0)::INT AS units_sold
        FROM menu_categories mc
        LEFT JOIN menu_items m ON mc.category_id = m.category_id
        LEFT JOIN order_items oi ON m.item_id = oi.item_id
        LEFT JOIN orders o ON oi.order_id = o.order_id AND o.status <> 'CANCELLED' ${orderWhere}
        GROUP BY mc.name ORDER BY revenue DESC`, [...params]),
      pool.query(`
        SELECT m.item_id, m.name, mc.name AS category
        FROM menu_items m
        LEFT JOIN order_items oi ON m.item_id = oi.item_id
        LEFT JOIN menu_categories mc ON m.category_id = mc.category_id
        WHERE m.is_active = true AND oi.order_item_id IS NULL`)
    ]);

    res.json({
      success: true,
      data: { bestSellers: bestRes.rows, worstSellers: worstRes.rows, byCategory: catRes.rows, neverOrdered: neverRes.rows }
    });
  }),

  // 5. CUSTOMER REPORT
  customerReport: asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const params = []; const conds = dateConditions(startDate, endDate, 'u.created_at', params);
    const where = conds.length ? "AND " + conds.join(' AND ') : '';

    const [summaryRes, topRes, recentRes] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::INT AS total_customers,
               COUNT(*) FILTER (WHERE u.status = 'ACTIVE')::INT AS active_customers,
               COUNT(*) FILTER (WHERE u.status <> 'ACTIVE')::INT AS inactive_customers
        FROM users u WHERE u.role = 'CUSTOMER' ${where}`, params),
      pool.query(`
        SELECT u.user_id, u.full_name, u.email, u.wallet_balance,
               COALESCE(SUM(o.total_amount) FILTER (WHERE o.status <> 'CANCELLED'), 0)::DECIMAL(10,2) AS total_spent,
               COUNT(o.order_id)::INT AS order_count
        FROM users u
        LEFT JOIN orders o ON u.user_id = o.user_id
        WHERE u.role = 'CUSTOMER'
        GROUP BY u.user_id, u.full_name, u.email, u.wallet_balance
        ORDER BY total_spent DESC LIMIT 10`),
      pool.query(`
        SELECT u.user_id, u.full_name, u.email, u.created_at
        FROM users u WHERE u.role = 'CUSTOMER'
        ORDER BY u.created_at DESC LIMIT 10`)
    ]);

    res.json({
      success: true,
      data: { summary: summaryRes.rows[0], topSpenders: topRes.rows, recentSignups: recentRes.rows }
    });
  }),

  // 6. ORDER ANALYTICS
  orderAnalyticsReport: asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const params = []; const conds = dateConditions(startDate, endDate, 'o.created_at', params);
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const [statusRes, peakRes, fulfillRes] = await Promise.all([
      pool.query(`
        SELECT o.status, COUNT(*)::INT AS count
        FROM orders o ${where}
        GROUP BY o.status ORDER BY count DESC`, params),
      pool.query(`
        SELECT EXTRACT(HOUR FROM o.created_at)::INT AS hour, COUNT(*)::INT AS orders
        FROM orders o ${where}
        GROUP BY hour ORDER BY orders DESC`, [...params]),
      pool.query(`
        SELECT COUNT(*)::INT AS total,
               COUNT(*) FILTER (WHERE status = 'CANCELLED')::INT AS cancelled,
               COUNT(*) FILTER (WHERE status = 'PICKED_UP')::INT AS completed,
               CASE WHEN COUNT(*) > 0
                 THEN ROUND(COUNT(*) FILTER (WHERE status = 'CANCELLED')::DECIMAL / COUNT(*) * 100, 1)
                 ELSE 0 END AS cancellation_rate
        FROM orders o ${where}`, [...params])
    ]);

    res.json({
      success: true,
      data: { byStatus: statusRes.rows, peakHours: peakRes.rows, fulfillment: fulfillRes.rows[0] }
    });
  }),

  // 7. CASH COLLECTION REPORT
  cashCollectionReport: asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const params = []; const conds = dateConditions(startDate, endDate, 'atl.created_at', params);
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const [summaryRes, dailyRes, byAdminRes] = await Promise.all([
      pool.query(`
        SELECT COALESCE(SUM(atl.amount), 0)::DECIMAL(10,2) AS total_collected,
               COUNT(*)::INT AS total_topups
        FROM admin_topup_log atl ${where}`, params),
      pool.query(`
        SELECT DATE(atl.created_at) AS date,
               COALESCE(SUM(atl.amount), 0)::DECIMAL(10,2) AS collected,
               COUNT(*)::INT AS topups
        FROM admin_topup_log atl ${where}
        GROUP BY DATE(atl.created_at) ORDER BY date DESC LIMIT 30`, [...params]),
      pool.query(`
        SELECT u.full_name AS admin_name,
               COALESCE(SUM(atl.amount), 0)::DECIMAL(10,2) AS collected,
               COUNT(*)::INT AS topups
        FROM admin_topup_log atl
        JOIN users u ON atl.admin_id = u.user_id
        ${where}
        GROUP BY u.full_name ORDER BY collected DESC`, [...params])
    ]);

    res.json({
      success: true,
      data: { summary: summaryRes.rows[0], daily: dailyRes.rows, byAdmin: byAdminRes.rows }
    });
  })
};

module.exports = reportController;
