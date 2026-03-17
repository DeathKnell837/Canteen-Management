import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import api from '../../api/axios';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    menuItems: 0,
    lowStock: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, menuRes, inventoryRes] = await Promise.all([
          api.get('/orders/admin/all'),
          api.get('/menu/items'),
          api.get('/inventory'),
        ]);

        const orders = ordersRes.data.data || ordersRes.data || [];
        const items = menuRes.data.data || menuRes.data || [];
        const inventory = inventoryRes.data.data || inventoryRes.data || [];

        const revenue = orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
        const pending = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
        const low = inventory.filter((inv) => parseFloat(inv.quantity) < 10).length;

        setStats({
          totalOrders: orders.length,
          pendingOrders: pending,
          totalRevenue: revenue,
          menuItems: items.length,
          lowStock: low,
        });
        setRecentOrders(orders.slice(0, 5));
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, gradient: 'from-blue-500 to-blue-600', light: 'bg-blue-50 text-blue-600', ring: 'ring-blue-200' },
    { label: 'Pending', value: stats.pendingOrders, icon: Clock, gradient: 'from-amber-500 to-amber-600', light: 'bg-amber-50 text-amber-600', ring: 'ring-amber-200', pulse: stats.pendingOrders > 0 },
    { label: 'Revenue', value: `₱${stats.totalRevenue.toFixed(0)}`, icon: TrendingUp, gradient: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-200' },
    { label: 'Menu Items', value: stats.menuItems, icon: UtensilsCrossed, gradient: 'from-brand-500 to-brand-600', light: 'bg-brand-50 text-brand-600', ring: 'ring-brand-200' },
    { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, gradient: stats.lowStock > 0 ? 'from-red-500 to-red-600' : 'from-gray-400 to-gray-500', light: stats.lowStock > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500', ring: stats.lowStock > 0 ? 'ring-red-200' : 'ring-gray-200', pulse: stats.lowStock > 0 },
  ];

  const statusColor = {
    PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    CONFIRMED: 'bg-blue-100 text-blue-700 border border-blue-200',
    PREPARING: 'bg-orange-100 text-orange-700 border border-orange-200',
    READY: 'bg-green-100 text-green-700 border border-green-200',
    PICKED_UP: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    CANCELLED: 'bg-red-100 text-red-700 border border-red-200',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton rounded-2xl h-32" />
          ))}
        </div>
        <div className="skeleton rounded-2xl h-64" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Overview of your cafeteria operations</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((c, idx) => (
          <div
            key={c.label}
            className="card-glass rounded-2xl p-5 card-hover animate-fade-in-up relative overflow-hidden"
            style={{ animationDelay: `${idx * 0.07}s`, animationFillMode: 'both' }}
          >
            {c.pulse && (
              <div className="absolute top-3 right-3">
                <span className="flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
              </div>
            )}
            <div className={`w-10 h-10 bg-gradient-to-br ${c.gradient} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white number-pop">{c.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="table-glass rounded-2xl shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.35s', animationFillMode: 'both' }}>
        <div className="p-5 border-b border-white/40 dark:border-gray-700/40 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">Recent Orders</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Last 5</span>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentOrders.map((o, idx) => (
              <div
                key={o.order_id}
                className="p-4 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                style={{ animationDelay: `${0.4 + idx * 0.05}s` }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300">
                  #{o.order_id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Order #{o.order_id}
                    {o.user_id && <span className="text-gray-400 dark:text-gray-500 font-normal ml-2">User #{o.user_id}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(o.created_at).toLocaleDateString('en-PH', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[o.status] || 'bg-gray-100 text-gray-600'}`}>
                  {o.status}
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">₱{(parseFloat(o.total_amount) || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link
          to="/admin/reports"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-semibold hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
        >
          View Detailed Reports
        </Link>
      </div>
    </div>
  );
}
