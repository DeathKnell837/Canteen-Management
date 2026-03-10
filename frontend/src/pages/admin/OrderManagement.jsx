import { useState, useEffect } from 'react';
import { ClipboardList, ChevronDown, RefreshCw, Search, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'CANCELLED'];

const statusColor = {
  PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-700 border border-blue-200',
  PREPARING: 'bg-orange-100 text-orange-700 border border-orange-200',
  READY: 'bg-green-100 text-green-700 border border-green-200',
  PICKED_UP: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-700 border border-red-200',
};

const statusEmoji = {
  PENDING: '🕐',
  CONFIRMED: '✅',
  PREPARING: '🍳',
  READY: '📦',
  PICKED_UP: '🚶',
  CANCELLED: '❌',
};

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadOrders = async () => {
    try {
      const res = await api.get('/orders/admin/all');
      setOrders(res.data.data || res.data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order #${orderId} → ${statusEmoji[newStatus] || ''} ${newStatus}`);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Update failed');
    }
  };

  const filtered = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search && !String(o.order_id).includes(search)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 skeleton rounded-lg" />
          <div className="h-10 w-28 skeleton rounded-xl" />
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-24 skeleton rounded-xl" />
          ))}
        </div>
        <div className="skeleton rounded-2xl h-80" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} total orders</p>
        </div>
        <button
          onClick={() => { setRefreshing(true); loadOrders(); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-[0.97]"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID..."
            className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all hover:border-gray-200"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filter === 'all' ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20' : 'bg-white/60 backdrop-blur-sm text-gray-600 hover:bg-white/80 border border-white/50'
            }`}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                filter === s ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20' : 'bg-white/60 backdrop-blur-sm text-gray-600 hover:bg-white/80 border border-white/50'
              }`}
            >
              {statusEmoji[s]} {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders table */}
      <div className="table-glass rounded-2xl shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase text-left">Order</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase text-left">User</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase text-left">Total</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase text-left">Date</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase text-left">Status</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase text-left">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((o) => (
                <tr key={o.order_id} className="hover:bg-brand-50/30 transition-colors group">
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">#{o.order_id}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">User #{o.user_id}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-gray-900">₱{(parseFloat(o.total_amount) || 0).toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {new Date(o.created_at).toLocaleDateString('en-PH', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[o.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusEmoji[o.status]} {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {o.status !== 'PICKED_UP' && o.status !== 'CANCELLED' ? (
                      <div className="relative">
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o.order_id, e.target.value)}
                          className="appearance-none pr-8 pl-3 py-2 border-2 border-gray-100 rounded-xl text-xs bg-white font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 hover:border-gray-200 transition-all"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 font-medium">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="text-3xl mb-2">📋</div>
                    <p className="text-gray-400 text-sm">No orders found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
