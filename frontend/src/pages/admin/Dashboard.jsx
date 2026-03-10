import { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, IndianRupee, UtensilsCrossed, AlertTriangle, TrendingUp, Users, Clock } from 'lucide-react';
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
        const pending = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
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
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'bg-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Revenue', value: `₹${stats.totalRevenue.toFixed(0)}`, icon: IndianRupee, color: 'bg-green-500', bg: 'bg-green-50' },
    { label: 'Menu Items', value: stats.menuItems, icon: UtensilsCrossed, color: 'bg-brand-500', bg: 'bg-brand-50' },
    { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: stats.lowStock > 0 ? 'bg-red-500' : 'bg-gray-400', bg: stats.lowStock > 0 ? 'bg-red-50' : 'bg-gray-50' },
  ];

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-brand-100 text-brand-700',
    ready: 'bg-green-100 text-green-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-brand-500" /> Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your canteen operations</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className={`${c.bg} rounded-xl p-4 border border-gray-100`}>
            <div className={`w-9 h-9 ${c.color} rounded-lg flex items-center justify-center mb-3`}>
              <c.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No orders yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentOrders.map((o) => (
              <div key={o.order_id} className="p-4 flex items-center gap-4">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500">
                  #{o.order_id}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Order #{o.order_id}
                    {o.user_id && <span className="text-gray-400 ml-2">by User #{o.user_id}</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(o.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[o.status] || 'bg-gray-100 text-gray-600'}`}>
                  {o.status}
                </span>
                <span className="text-sm font-semibold text-gray-900">₹{parseFloat(o.total_amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
