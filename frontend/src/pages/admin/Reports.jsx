import { useEffect, useState } from 'react';
import { BarChart3, Wallet, ShoppingBag, Trophy, Printer, Download } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState({ summary: null, topSellingItems: [] });
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [reportRes, lowRes] = await Promise.all([
          api.get('/orders/admin/reports/summary'),
          api.get('/inventory/low-stock'),
        ]);

        setReport(reportRes.data.data || { summary: null, topSellingItems: [] });
        setLowStockItems(lowRes.data.data || []);
      } catch {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const summary = report.summary || {};

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const handlePrint = () => {
    const summaryRows = [
      ['Total Orders', String(summary.total_orders || 0)],
      ['Successful Orders', String(summary.successful_orders || 0)],
      ['Low Stock Items', String(lowStockItems.length)],
      ['Total Revenue', `PHP ${parseFloat(summary.total_revenue || 0).toFixed(2)}`]
    ];

    const topSellingRows = (report.topSellingItems || []).map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(item.name)}</td>
        <td>${item.units_sold || 0}</td>
        <td>PHP ${parseFloat(item.sales || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const lowStockRows = (lowStockItems || []).map((item) => `
      <tr>
        <td>${escapeHtml(item.item_name)}</td>
        <td>${item.quantity || 0}</td>
        <td>${item.reorder_level || 0}</td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank', 'width=1024,height=768');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the report.');
      return;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>R&R Cafeteria Reports</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
    .header { margin-bottom: 18px; }
    .title { font-size: 24px; font-weight: 700; margin: 0; }
    .subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .section { margin-top: 18px; }
    .section h2 { font-size: 16px; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; }
    th { background: #f3f4f6; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .summary-item { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px; }
    .summary-item .k { color: #6b7280; font-size: 11px; }
    .summary-item .v { font-size: 16px; font-weight: 700; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">R&R Cafeteria Reports</h1>
    <p class="subtitle">Generated on ${new Date().toLocaleString('en-PH')}</p>
  </div>

  <div class="section">
    <h2>Summary</h2>
    <div class="summary-grid">
      ${summaryRows.map(([k, v]) => `<div class="summary-item"><div class="k">${escapeHtml(k)}</div><div class="v">${escapeHtml(v)}</div></div>`).join('')}
    </div>
  </div>

  <div class="section">
    <h2>Top-Selling Items</h2>
    <table>
      <thead>
        <tr><th>Rank</th><th>Item Name</th><th>Units Sold</th><th>Sales</th></tr>
      </thead>
      <tbody>
        ${topSellingRows || '<tr><td colspan="4">No sales data yet.</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Low Stock Items</h2>
    <table>
      <thead>
        <tr><th>Item Name</th><th>Quantity</th><th>Reorder Level</th></tr>
      </thead>
      <tbody>
        ${lowStockRows || '<tr><td colspan="3">No low stock items.</td></tr>'}
      </tbody>
    </table>
  </div>

  <script>
    window.onload = function () {
      window.print();
      setTimeout(function () { window.close(); }, 200);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
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
      ['Low Stock Items', String(lowStockItems.length)],
      ['Total Revenue', String(parseFloat(summary.total_revenue || 0).toFixed(2))]
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

            <div className="card-glass rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{lowStockItems.length}</p>
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
