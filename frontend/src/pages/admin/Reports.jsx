import { useEffect, useState } from 'react';
import { BarChart3, Wallet, ShoppingBag, Trophy, Printer, Download } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState({ summary: null, topSellingItems: [] });
  const [inventory, setInventory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [reportRes, invRes, lowRes, ordersRes] = await Promise.all([
          api.get('/orders/admin/reports/summary'),
          api.get('/inventory'),
          api.get('/inventory/low-stock'),
          api.get('/orders/admin/all')
        ]);

        setReport(reportRes.data.data || { summary: null, topSellingItems: [] });
        setInventory(invRes.data.data || []);
        setLowStockItems(lowRes.data.data || []);
        setOrders(ordersRes.data.data || []);
      } catch {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const summary = report.summary || {};
  const totalInventoryUnits = (inventory || []).reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
  const cancelledOrders = (orders || []).filter((o) => o.status === 'CANCELLED').length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Rank', 'Item Name', 'Units Sold', 'Sales'];
    const rows = (report.topSellingItems || []).map((item, idx) => [
      String(idx + 1),
      item.name,
      String(item.units_sold),
      String(parseFloat(item.sales || 0).toFixed(2))
    ]);

    const summaryRows = [
      ['Total Orders', String(summary.total_orders || 0)],
      ['Successful Orders', String(summary.successful_orders || 0)],
      ['Cancelled Orders', String(cancelledOrders)],
      ['Low Stock Items', String(lowStockItems.length)],
      ['Inventory Units', String(totalInventoryUnits)],
      ['Total Revenue', String(parseFloat(summary.total_revenue || 0).toFixed(2))],
      ['Cash Flow Statement', 'Pending module'],
      ['Balance Sheet', 'Pending module'],
      ['Audit Findings', 'Pending module']
    ];

    const csv = [
      ['R&R Cafeteria Reports'],
      [],
      ['Summary'],
      ...summaryRows,
      [],
      ['Top Selling Items'],
      headers,
      ...rows
    ]
      .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rr-cafeteria-reports.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sales summary, top-selling items, and total revenue</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-sm font-semibold hover:bg-brand-100 dark:hover:bg-brand-900/30"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card-glass rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_orders || 0}</p>
            </div>

            <div className="card-glass rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Successful Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.successful_orders || 0}</p>
            </div>

            <div className="card-glass rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₱{parseFloat(summary.total_revenue || 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="card-glass rounded-2xl p-5 mb-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-3">Comprehensive Report Sections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <p className="font-semibold text-gray-900 dark:text-white">1. Financial Reports</p>
                <p className="text-gray-600 dark:text-gray-300">Sales Report: Available</p>
                <p className="text-gray-600 dark:text-gray-300">Income Statement, Balance Sheet, Cash Flows: Pending module</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <p className="font-semibold text-gray-900 dark:text-white">2. Inventory & Stock</p>
                <p className="text-gray-600 dark:text-gray-300">Real-time inventory units: {totalInventoryUnits}</p>
                <p className="text-gray-600 dark:text-gray-300">Low stock alerts: {lowStockItems.length}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <p className="font-semibold text-gray-900 dark:text-white">3. Operational Performance</p>
                <p className="text-gray-600 dark:text-gray-300">Top-selling items: Available</p>
                <p className="text-gray-600 dark:text-gray-300">Peak hours, staffing attendance, user usage by department: Pending module</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                <p className="font-semibold text-gray-900 dark:text-white">4. Compliance & Quality</p>
                <p className="text-gray-600 dark:text-gray-300">Permits, safety audits, temperature logs, nutrition compliance: Pending module</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 md:col-span-2">
                <p className="font-semibold text-gray-900 dark:text-white">5. Admin & Feedback</p>
                <p className="text-gray-600 dark:text-gray-300">Cancelled orders tracked: {cancelledOrders}</p>
                <p className="text-gray-600 dark:text-gray-300">Audit findings, complaint log, maintenance records: Pending module</p>
              </div>
            </div>
          </div>

          <div className="card-glass rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white">Top-Selling Items</h2>
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>

            {report.topSellingItems.length === 0 ? (
              <div className="p-10 text-center text-gray-500 dark:text-gray-400">No sales data yet.</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {report.topSellingItems.map((item, idx) => (
                  <div key={item.item_id} className="p-4 sm:p-5 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">#{idx + 1} {item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Units sold: {item.units_sold}</p>
                    </div>
                    <p className="font-bold text-brand-600">₱{parseFloat(item.sales || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
