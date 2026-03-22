import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, AlertTriangle, Clock,
  TrendingUp, Users, Wallet, ChefHat, Package, CheckCircle2, XCircle,
  ArrowRight, DollarSign, BarChart3
} from 'lucide-react';
import api from '../../api/axios';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    menuItems: 0,
    lowStock: 0,
    totalCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
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

        const completedOrders = orders.filter((o) => o.status === 'PICKED_UP' || o.status === 'COMPLETED');
        const revenue = completedOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

        const today = new Date().toDateString();
        const todayCompleted = completedOrders.filter((o) => new Date(o.created_at).toDateString() === today);
        const todayRevenue = todayCompleted.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

        const pending = orders.filter((o) => o.status === 'PENDING').length;
        const confirmed = orders.filter((o) => o.status === 'CONFIRMED').length;
        const preparing = orders.filter((o) => o.status === 'PREPARING').length;
        const ready = orders.filter((o) => o.status === 'READY').length;
        const completed = completedOrders.length;
        const cancelled = orders.filter((o) => o.status === 'CANCELLED').length;
        const low = inventory.filter((inv) => parseFloat(inv.quantity) < 10).length;

        // Count unique customers
        const uniqueCustomers = new Set(orders.map((o) => o.user_id)).size;

        setStats({
          totalOrders: orders.length,
          pendingOrders: pending + confirmed,
          preparingOrders: preparing,
          readyOrders: ready,
          completedOrders: completed,
          cancelledOrders: cancelled,
          totalRevenue: revenue,
          todayRevenue: todayRevenue,
          menuItems: items.length,
          lowStock: low,
          totalCustomers: uniqueCustomers,
        });
        setRecentOrders(orders.slice(0, 8));

        // Build top sold items from orders with item details
        // We'll use inventory + menu items for a quick top items display
        const sorted = [...inventory].sort((a, b) => parseFloat(a.quantity) - parseFloat(b.quantity));
        setTopItems(sorted.slice(0, 5));
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const mainCards = [
    { label: 'Total Revenue', value: `₱${stats.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, subtitle: `₱${stats.todayRevenue.toFixed(2)} today`, icon: DollarSign, gradient: 'from-emerald-500 to-emerald-600', ring: 'ring-emerald-200' },
    { label: 'Total Orders', value: stats.totalOrders, subtitle: `${stats.completedOrders} completed`, icon: ShoppingBag, gradient: 'from-blue-500 to-blue-600', ring: 'ring-blue-200' },
    { label: 'Menu Items', value: stats.menuItems, subtitle: `${stats.lowStock} low stock`, icon: UtensilsCrossed, gradient: 'from-brand-500 to-brand-600', ring: 'ring-brand-200' },
    { label: 'Customers', value: stats.totalCustomers, subtitle: 'unique buyers', icon: Users, gradient: 'from-violet-500 to-violet-600', ring: 'ring-violet-200' },
  ];

  const orderStatusCards = [
    { label: 'Pending', value: stats.pendingOrders, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', pulse: stats.pendingOrders > 0 },
    { label: 'Preparing', value: stats.preparingOrders, icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
    { label: 'Ready', value: stats.readyOrders, icon: Package, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', pulse: stats.readyOrders > 0 },
    { label: 'Completed', value: stats.completedOrders, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
    { label: 'Cancelled', value: stats.cancelledOrders, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
    { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: stats.lowStock > 0 ? 'text-red-500' : 'text-gray-400', bg: stats.lowStock > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800', border: stats.lowStock > 0 ? 'border-red-200 dark:border-red-800' : 'border-gray-200 dark:border-gray-700', pulse: stats.lowStock > 0 },
  ];

  const statusColor = {
    PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    CONFIRMED: 'bg-blue-100 text-blue-700 border border-blue-200',
    PREPARING: 'bg-orange-100 text-orange-700 border border-orange-200',
    READY: 'bg-green-100 text-green-700 border border-green-200',
    PICKED_UP: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    CANCELLED: 'bg-red-100 text-red-700 border border-red-200',
  };

  const statusLabel = {
    PENDING: 'Pending',
    CONFIRMED: 'Paid',
    PREPARING: 'Preparing',
    READY: 'Ready',
    PICKED_UP: 'Completed',
    CANCELLED: 'Cancelled',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton rounded-2xl h-32" />
          ))}
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton rounded-xl h-20" />
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

      {/* Main stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {mainCards.map((c, idx) => (
          <div
            key={c.label}
            className="card-glass rounded-2xl p-5 card-hover animate-fade-in-up relative overflow-hidden"
            style={{ animationDelay: `${idx * 0.07}s`, animationFillMode: 'both' }}
          >
            <div className={`w-10 h-10 bg-gradient-to-br ${c.gradient} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white number-pop">{c.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{c.label}</p>
            {c.subtitle && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{c.subtitle}</p>}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${c.gradient} opacity-[0.04] rounded-full`} />
          </div>
        ))}
      </div>

      {/* Order Status Pipeline */}
      <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.28s', animationFillMode: 'both' }}>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5" /> Order Status Overview
        </h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {orderStatusCards.map((c, idx) => (
            <div
              key={c.label}
              className={`relative rounded-xl px-4 py-3 border ${c.border} ${c.bg} transition-all hover:scale-[1.02]`}
              style={{ animationDelay: `${0.3 + idx * 0.04}s` }}
            >
              {c.pulse && (
                <div className="absolute top-2 right-2">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                </div>
              )}
              <c.icon className={`w-4 h-4 ${c.color} mb-1`} />
              <p className="text-xl font-bold text-gray-900 dark:text-white">{c.value}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom section: Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders - takes 2 columns */}
        <div className="lg:col-span-2 table-glass rounded-2xl shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.35s', animationFillMode: 'both' }}>
          <div className="p-5 border-b border-white/40 dark:border-gray-700/40 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
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
                      {o.full_name && <span className="text-gray-400 dark:text-gray-500 font-normal ml-2">{o.full_name}</span>}
                      {!o.full_name && o.user_id && <span className="text-gray-400 dark:text-gray-500 font-normal ml-2">User #{o.user_id}</span>}
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
                    {statusLabel[o.status] || o.status}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">₱{(parseFloat(o.total_amount) || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Alerts sidebar */}
        <div className="table-glass rounded-2xl shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
          <div className="p-5 border-b border-white/40 dark:border-gray-700/40 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock
            </h2>
            <Link to="/admin/inventory" className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {topItems.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">All items stocked</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {topItems.map((item) => {
                const qty = parseFloat(item.quantity);
                const isLow = qty < 10;
                return (
                  <div key={item.item_id || item.inventory_id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isLow ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500'}`}>
                      {qty}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.item_name || item.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {isLow ? '⚠️ Needs restock' : '✓ Adequate'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-3 flex-wrap animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-sm"
        >
          <Clock className="w-4 h-4" /> Manage Orders
        </Link>
        <Link
          to="/admin/menu"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-semibold hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors text-sm"
        >
          <UtensilsCrossed className="w-4 h-4" /> Menu Management
        </Link>
        <Link
          to="/admin/reports"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-semibold hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors text-sm"
        >
          <TrendingUp className="w-4 h-4" /> View Reports
        </Link>
        <Link
          to="/admin/topup"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm"
        >
          <Wallet className="w-4 h-4" /> Wallet Top-up
        </Link>
      </div>
    </div>
  );
}
