import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CreditCard, ShieldCheck, UtensilsCrossed, X, Lock } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE_PAYMENT');
  const submitting = useRef(false);
  const navigate = useNavigate();

  // Wallet PIN state
  const [hasPin, setHasPin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    const checkPin = async () => {
      try {
        const res = await api.get('/payments/wallet/pin/status');
        setHasPin(res.data.data.hasPin);
      } catch {
        setHasPin(false);
      }
    };
    checkPin();
  }, []);

  const TAX_RATE = 0.05;
  const tax = total * TAX_RATE;
  const grandTotal = total + tax;

  const PAYMENT_OPTIONS = [
    { value: 'ONLINE_PAYMENT', label: 'Online Payment' },
    { value: 'DIRECT_CASH', label: 'Direct Cash' },
  ];

  const selectedPaymentLabel = PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label || 'Online Payment';

  const handlePayClick = () => {
    if (items.length === 0 || submitting.current) return;

    // If online payment and user has a PIN set, show PIN modal first
    if (paymentMethod === 'ONLINE_PAYMENT' && hasPin) {
      setPinInput('');
      setPinError('');
      setShowPinModal(true);
      return;
    }

    // Otherwise proceed directly (Direct Cash or no PIN set)
    handleCheckout();
  };

  const handlePinSubmit = async () => {
    if (!/^[0-9]{4,6}$/.test(pinInput)) {
      setPinError('PIN must be 4-6 digits');
      return;
    }

    // Verify PIN by attempting a wallet balance check approach
    // We'll verify it during the actual payment, but first do a quick frontend validation
    setPinError('');
    setShowPinModal(false);
    handleCheckout(pinInput);
  };

  const handleCheckout = async (verifiedPin = null) => {
    if (!window.confirm(`Confirm ${selectedPaymentLabel} payment of ₱${grandTotal.toFixed(2)} for this order?`)) {
      return;
    }

    submitting.current = true;
    setLoading(true);
    let createdOrderId = null;
    try {
      const orderRes = await api.post('/orders', {
        deliveryType: 'PICKUP',
        items: items.map((i) => ({ item_id: i.item_id, quantity: i.quantity })),
      });
      const order = orderRes.data.data || orderRes.data;
      createdOrderId = order.order_id;

      await api.post('/payments/process', {
        orderId: order.order_id,
        paymentMethod,
        amount: parseFloat(order.total_amount),
        ...(verifiedPin ? { walletPin: verifiedPin } : {}),
      });

      clearCart();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      // If order was created but payment failed, cancel it so it doesn't stay stuck
      if (createdOrderId) {
        try { await api.put(`/orders/${createdOrderId}/cancel`); } catch {}
      }
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Checkout failed';
      toast.error(msg);
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in-up">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
          <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
        <p className="text-gray-400 dark:text-gray-500 mb-8">Add some delicious Filipino food from the menu</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center max-w-sm">
          Checkout supports Online Payment or Direct Cash once you add an item.
        </p>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-brand-500/25 transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" /> Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <>
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Cart</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.item_id}
              className="card-glass rounded-2xl p-4 sm:p-5 flex items-center gap-4 card-hover animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-brand-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <UtensilsCrossed className="w-6 h-6 text-brand-400 dark:text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</h3>
                <p className="text-brand-600 font-bold text-sm mt-0.5">₱{(parseFloat(item.price) || 0).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 transition-all active:scale-90"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-sm text-gray-900 dark:text-white">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 transition-all active:scale-90"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="w-20 text-right font-bold text-gray-900 dark:text-white hidden sm:block">
                ₱{((parseFloat(item.price) || 0) * item.quantity).toFixed(2)}
              </span>
              <button
                onClick={() => removeItem(item.item_id)}
                className="text-gray-300 dark:text-gray-600 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card-glass rounded-2xl p-6 sticky top-6 animate-slide-in-right">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-5">Order Summary</h2>

            {/* Price breakdown */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {PAYMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Tax (5%)</span>
                <span>₱{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 dark:text-white text-lg border-t border-dashed border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <span>Total</span>
                <span className="text-brand-600">₱{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePayClick}
              disabled={loading}
              className="w-full mt-6 py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-bold hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/25 hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Placing order...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span className="leading-none text-center">Pay with {selectedPaymentLabel} ₱{grandTotal.toFixed(2)}</span>
                </>
              )}
            </button>

            <button
              onClick={clearCart}
              className="w-full mt-2 py-2.5 text-sm text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
            >
              Clear Cart
            </button>

            {/* Trust badges */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure checkout payment
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Wallet PIN Verification Modal */}
    {showPinModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-overlay-in" onClick={() => setShowPinModal(false)} />
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl animate-modal-in">
          <button onClick={() => setShowPinModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Enter Wallet PIN</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Verify your identity to proceed</p>
            </div>
          </div>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pinInput}
            onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
            placeholder="4-6 digit PIN"
            autoFocus
            className={`w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold border rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400 ${
              pinError ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
            }`}
          />
          {pinError && <p className="text-xs text-red-500 mt-2 text-center">{pinError}</p>}
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setShowPinModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handlePinSubmit}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-bold hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/20"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
