import { useState, useEffect } from 'react';
import { ClipboardList, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Package } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_MAP = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  PREPARING: { label: 'Preparing', color: 'bg-brand-100 text-brand-700', icon: Package },
  READY: { label: 'Ready', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  PICKED_UP: { label: 'Picked Up', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
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
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Track your order history</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No orders yet</p>
          <p className="text-gray-400 text-sm mt-1">Your orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const s = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
            const StatusIcon = s.icon;
            const isExpanded = expanded === order.order_id;

            return (
              <div
                key={order.order_id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : order.order_id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">Order #{order.order_id}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {s.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' · '}
                      {order.delivery_type === 'PICKUP' ? 'Pickup' : 'Delivery'}
                    </p>
                  </div>
                  <span className="font-bold text-gray-900">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {/* Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4">
                    <OrderItems orderId={order.order_id} />
                    {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleCancel(order.order_id)}
                          className="text-sm text-red-500 font-medium hover:text-red-600"
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
    return <div className="text-sm text-gray-400">Loading items...</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-900">{item.item_name || item.name || `Item #${item.item_id}`}</span>
            <span className="text-gray-400">x{item.quantity}</span>
          </div>
          <span className="text-gray-600">₱{parseFloat(item.subtotal || item.price_at_time * item.quantity).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
