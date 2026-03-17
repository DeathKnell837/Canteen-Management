import { useState, useEffect } from 'react';
import { ClipboardList, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Package, Loader2, Receipt, Printer, Wallet, ChefHat, UtensilsCrossed } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_MAP = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, active: true },
  CONFIRMED: { label: 'Paid', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Wallet, active: true },
  PREPARING: { label: 'Preparing', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: ChefHat, active: true },
  READY: { label: 'Ready for Pickup', color: 'bg-green-100 text-green-700 border-green-200', icon: Package, active: true },
  PICKED_UP: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);

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
          <ClipboardList className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
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
                    <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center gap-3 flex-wrap">
                      {order.status !== 'PENDING' && order.status !== 'CANCELLED' && (
                        <button
                          onClick={() => setReceiptOrder(order)}
                          className="text-sm text-blue-600 font-semibold hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          View Receipt
                        </button>
                      )}
                      {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                        <button
                          onClick={() => handleCancel(order.order_id)}
                          className="text-sm text-red-500 font-semibold hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.subtotal || item.price_at_time * item.quantity), 0);
  const total = parseFloat(order.total_amount);
  const tax = total - subtotal;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    const receiptHTML = `<!DOCTYPE html><html><head><title>Receipt #${order.order_id}</title>
<style>body{font-family:'Courier New',monospace;max-width:320px;margin:20px auto;font-size:13px}
.center{text-align:center}.line{border-top:1px dashed #000;margin:8px 0}
.row{display:flex;justify-content:space-between}.bold{font-weight:bold}
@media print{button{display:none}}</style></head><body>
<div class="center"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c1.7 1.7 4.3 1.7 6 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/></svg><h2 style="margin:4px 0 0">R&R Cafeteria</h2><p>Order Receipt</p></div>
<div class="line"></div>
<div class="row"><span>Order #</span><span class="bold">${order.order_id}</span></div>
<div class="row"><span>Date</span><span>${new Date(order.created_at).toLocaleDateString('en-PH',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span></div>
<div class="row"><span>Status</span><span>${(STATUS_MAP[order.status]||{}).label||order.status}</span></div>
<div class="line"></div>
${items.map(i=>`<div class="row"><span>${i.item_name||i.name} x${i.quantity}</span><span>₱${parseFloat(i.subtotal||i.price_at_time*i.quantity).toFixed(2)}</span></div>`).join('')}
<div class="line"></div>
<div class="row"><span>Subtotal</span><span>₱${subtotal.toFixed(2)}</span></div>
${tax>0?`<div class="row"><span>Tax</span><span>₱${tax.toFixed(2)}</span></div>`:''}
<div class="row bold"><span>Total</span><span>₱${total.toFixed(2)}</span></div>
<div class="line"></div>
<div class="center" style="margin-top:12px"><p>Thank you for your order!</p></div>
<button onclick="window.print()" style="width:100%;padding:8px;margin-top:12px;cursor:pointer">Print</button>
</body></html>`;
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="text-center mb-4">
            <UtensilsCrossed className="w-8 h-8 text-brand-500 mx-auto mb-1" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">R&R Cafeteria Receipt</h3>
          </div>

          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-3" />

          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Order #</span>
            <span className="font-bold text-gray-900 dark:text-white">{order.order_id}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Date</span>
            <span className="text-gray-700 dark:text-gray-300">{new Date(order.created_at).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Status</span>
            <span className="text-gray-700 dark:text-gray-300">{(() => { const SIcon = (STATUS_MAP[order.status] || {}).icon; return SIcon ? <SIcon className="w-3.5 h-3.5 inline mr-1" /> : null; })()} {(STATUS_MAP[order.status] || {}).label || order.status}</span>
          </div>

          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-3" />

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-3">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{item.item_name || item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                    <span className="font-medium text-gray-900 dark:text-white">₱{parseFloat(item.subtotal || item.price_at_time * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-3" />

              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-700 dark:text-gray-300">₱{subtotal.toFixed(2)}</span>
              </div>
              {tax > 0.01 && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Tax</span>
                  <span className="text-gray-700 dark:text-gray-300">₱{tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold mt-2">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-brand-600">₱{total.toFixed(2)}</span>
              </div>
            </>
          )}

          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-4" />

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
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
