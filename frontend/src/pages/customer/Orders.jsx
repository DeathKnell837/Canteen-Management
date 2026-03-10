import { useState, useEffect } from 'react';
import { ClipboardList, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Package, Loader2, Receipt } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_MAP = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, active: true },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2, active: true },
  PREPARING: { label: 'Preparing', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Package, active: true },
  READY: { label: 'Ready for Pickup', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2, active: true },
  PICKED_UP: { label: 'Picked Up', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const loadOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.data || res.data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancel = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled');
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Cancel failed');
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-8 w-40 skeleton mb-2" />
          <div className="h-4 w-56 skeleton" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card-glass rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 skeleton rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 skeleton" />
                  <div className="h-4 w-48 skeleton" />
                </div>
                <div className="h-6 w-20 skeleton rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Orders</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track your order history</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24 animate-fade-in">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No orders yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Your orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, idx) => {
            const s = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
            const StatusIcon = s.icon;
            const isExpanded = expanded === order.order_id;

            return (
              <div
                key={order.order_id}
                className="card-glass rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}
              >
                {/* Header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : order.order_id)}
                  className="w-full p-4 sm:p-5 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-5 h-5 text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-white">Order #{order.order_id}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.color} ${s.active ? 'status-pulse' : ''}`}>
                        <StatusIcon className="w-3 h-3" />
                        {s.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(order.created_at).toLocaleDateString('en-PH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="font-bold text-brand-600 text-lg hidden sm:block">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 ${isExpanded ? 'rotate-180 bg-gray-100 dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </button>

                {/* Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-4 sm:p-5 animate-fade-in-down bg-gray-50/30 dark:bg-gray-800/30">
                    <OrderItems orderId={order.order_id} />
                    <div className="sm:hidden mt-3 text-right">
                      <span className="font-bold text-brand-600">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                    {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                      <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        <button
                          onClick={() => handleCancel(order.order_id)}
                          className="text-sm text-red-500 font-semibold hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderItems({ orderId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/orders/${orderId}`)
      .then((res) => {
        const data = res.data.data || res.data;
        setItems(data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading items...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">{item.item_name || item.name || `Item #${item.item_id}`}</span>
            <span className="text-gray-400 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">x{item.quantity}</span>
          </div>
          <span className="font-medium text-gray-600 dark:text-gray-300">₱{parseFloat(item.subtotal || item.price_at_time * item.quantity).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
