import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardList, RefreshCw, Search, Loader2, ChefHat, Package, CheckCircle2, XCircle, Receipt, Printer, X, Clock, Wallet, UtensilsCrossed } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Paid',
  PREPARING: 'Preparing',
  READY: 'Ready',
  PICKED_UP: 'Completed',
  CANCELLED: 'Cancelled',
};

const statusColor = {
  PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-700 border border-blue-200',
  PREPARING: 'bg-orange-100 text-orange-700 border border-orange-200',
  READY: 'bg-green-100 text-green-700 border border-green-200',
  PICKED_UP: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-700 border border-red-200',
};

const StatusIcon = {
  PENDING: Clock,
  CONFIRMED: Wallet,
  PREPARING: ChefHat,
  READY: Package,
  PICKED_UP: CheckCircle2,
  CANCELLED: XCircle,
};

// What's the next action for each status?
const NEXT_ACTION = {
  CONFIRMED: { label: 'Start Preparing', icon: ChefHat, next: 'PREPARING', color: 'bg-orange-500 hover:bg-orange-600' },
  PREPARING: { label: 'Mark Ready', icon: Package, next: 'READY', color: 'bg-green-500 hover:bg-green-600' },
  READY: { label: 'Mark Completed', icon: CheckCircle2, next: 'PICKED_UP', color: 'bg-emerald-500 hover:bg-emerald-600' },
};

const FILTER_TABS = ['all', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'CANCELLED'];

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [receiptOrder, setReceiptOrder] = useState(null);

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
      toast.success(`Order #${orderId} → ${STATUS_LABELS[newStatus]}`);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Update failed');
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'CANCELLED' });
      toast.success(`Order #${orderId} cancelled`);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Cancel failed');
    }
  };

  const filtered = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search && !String(o.order_id).includes(search) && !(o.customer_name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Count by status for filter tabs
  const counts = {};
  orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Order Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{orders.length} total orders</p>
        </div>
        <button
          onClick={() => { setRefreshing(true); loadOrders(); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600 transition-all active:scale-[0.97]"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID or customer..."
            className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all hover:border-gray-200 dark:hover:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TABS.map((s) => {
            const SIcon = StatusIcon[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-1.5 ${
                  filter === s ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20' : 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 border border-white/50 dark:border-gray-700'
                }`}
              >
                {s === 'all' ? `All (${orders.length})` : <>{SIcon && <SIcon className="w-3.5 h-3.5" />} {STATUS_LABELS[s]} ({counts[s] || 0})</>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders table */}
      <div className="table-glass rounded-2xl shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-800/80">
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Order</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Customer</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Total</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Date</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Status</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map((o) => {
                const action = NEXT_ACTION[o.status];
                const ActionIcon = action?.icon;
                return (
                  <tr key={o.order_id} className="hover:bg-brand-50/30 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-lg">#{o.order_id}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{o.customer_name || `User #${o.user_id}`}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-gray-900 dark:text-white">₱{(parseFloat(o.total_amount) || 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(o.created_at).toLocaleDateString('en-PH', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      {(() => { const SIcon = StatusIcon[o.status]; return (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[o.status] || 'bg-gray-100 text-gray-600'}`}>
                          {SIcon && <SIcon className="w-3 h-3" />} {STATUS_LABELS[o.status] || o.status}
                        </span>
                      ); })()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {/* Next step action button */}
                        {action && (
                          <button
                            onClick={() => updateStatus(o.order_id, action.next)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${action.color} transition-all active:scale-95 shadow-sm`}
                          >
                            <ActionIcon className="w-3.5 h-3.5" />
                            {action.label}
                          </button>
                        )}
                        {/* Cancel button for non-preparing orders */}
                        {(o.status === 'PENDING' || o.status === 'CONFIRMED') && (
                          <button
                            onClick={() => cancelOrder(o.order_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        )}
                        {/* Receipt button for paid/completed orders */}
                        {o.status !== 'PENDING' && o.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setReceiptOrder(o)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                        )}
                        {/* Done label */}
                        {(o.status === 'PICKED_UP' || o.status === 'CANCELLED') && !action && (
                          <span className="text-xs text-gray-300 dark:text-gray-600 font-medium">{o.status === 'PICKED_UP' ? 'Done' : 'Cancelled'}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <ClipboardList className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No orders found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt modal */}
      {receiptOrder && (
        <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
      )}
    </div>
  );
}

function ReceiptModal({ order, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${order.order_id}`)
      .then(res => {
        const data = res.data.data || res.data;
        setItems(data.items || []);
      })
      .catch(() => toast.error('Failed to load receipt'))
      .finally(() => setLoading(false));
  }, [order.order_id]);

  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.subtotal || i.base_price * i.quantity || 0), 0);
  const total = parseFloat(order.total_amount) || 0;
  const tax = total - subtotal;

  const handlePrint = () => {
    const printArea = document.getElementById('receipt-content');
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt #${order.order_id}</title><style>
      body { font-family: 'Courier New', monospace; padding: 20px; max-width: 350px; margin: 0 auto; font-size: 13px; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .line { border-top: 1px dashed #000; margin: 8px 0; }
      .flex { display: flex; justify-content: space-between; }
      .mt { margin-top: 6px; }
      h2 { margin: 0 0 4px; font-size: 18px; }
      p { margin: 2px 0; }
    </style></head><body>`);
    win.document.write(printArea.innerHTML);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl animate-modal-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white">Receipt</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="p-2 text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-all">
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt content */}
        <div className="p-5" id="receipt-content">
          <div className="center">
            <UtensilsCrossed className="w-6 h-6 mx-auto mb-1 text-gray-700 dark:text-gray-300" />
            <h2 className="bold">Canteen</h2>
            <p style={{fontSize: 12, color: '#888'}}>Canteen Management System</p>
            <div className="line" />
          </div>

          <div className="mt" style={{fontSize: 13}}>
            <div className="flex"><span>Order:</span><span className="bold">#{order.order_id}</span></div>
            <div className="flex"><span>Customer:</span><span>{order.customer_name || `User #${order.user_id}`}</span></div>
            <div className="flex"><span>Date:</span><span>{new Date(order.created_at).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
            <div className="flex"><span>Status:</span><span className="inline-flex items-center gap-1">{(() => { const SIcon = StatusIcon[order.status]; return SIcon ? <SIcon className="w-3 h-3" /> : null; })()} {STATUS_LABELS[order.status]}</span></div>
          </div>

          <div className="line" />

          {loading ? (
            <div className="flex items-center gap-2 py-4 justify-center text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {item.item_name || item.name || `Item #${item.item_id}`} x{item.quantity}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">₱{parseFloat(item.subtotal || item.base_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="line" />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Tax</span>
                    <span>₱{tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base pt-1">
                  <span>Total</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="line" />
              <p className="center" style={{fontSize: 11, color: '#999'}}>Thank you for your order!</p>
              <p className="center" style={{fontSize: 11, color: '#999'}}>Paid via Wallet</p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
