import { useEffect, useState } from 'react';
import { BarChart3, Wallet, ShoppingBag, Trophy } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState({ summary: null, topSellingItems: [] });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/orders/admin/reports/summary');
        setReport(res.data.data || { summary: null, topSellingItems: [] });
      } catch {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const summary = report.summary || {};

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sales summary, top-selling items, and total revenue</p>
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
