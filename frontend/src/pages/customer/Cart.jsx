import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();
  const [orderType, setOrderType] = useState('dine_in');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const TAX_RATE = 0.05;
  const tax = total * TAX_RATE;
  const grandTotal = total + tax;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      // 1. Create the order
      const orderRes = await api.post('/orders', {
        order_type: orderType,
        items: items.map((i) => ({ item_id: i.item_id, quantity: i.quantity })),
      });
      const order = orderRes.data.data || orderRes.data;

      // 2. Process wallet payment
      await api.post('/payments/process', {
        order_id: order.order_id,
        payment_method: 'wallet',
      });

      clearCart();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Checkout failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some delicious items from the menu</p>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cart</h1>
        <p className="text-gray-500 text-sm mt-1">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.item_id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
            >
              <div className="w-16 h-16 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <ShoppingBag className="w-6 h-6 text-brand-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                <p className="text-brand-600 font-semibold text-sm">₹{item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                  className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                  className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="w-20 text-right font-semibold text-gray-900">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
              <button
                onClick={() => removeItem(item.item_id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>

            {/* Order type */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Order Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'dine_in', label: 'Dine In' },
                  { value: 'takeaway', label: 'Takeaway' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setOrderType(opt.value)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                      orderType === opt.value
                        ? 'border-brand-500 bg-brand-50 text-brand-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full mt-5 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Placing order...' : `Pay ₹${grandTotal.toFixed(2)} with Wallet`}
            </button>

            <button
              onClick={clearCart}
              className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
