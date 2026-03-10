import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ShoppingCart, Plus, Leaf, Flame, ChevronDown, Clock, Check, X, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

/* Map food names to emoji for fun placeholders when no image exists */
const FOOD_EMOJI = {
  'chicken adobo': '🍗', 'pork sinigang': '🍲', 'beef caldereta': '🥩', 'pinakbet': '🥬',
  'ginataang kalabasa': '🎃', 'lumpiang shanghai': '🥟', 'banana cue': '🍌', 'turon': '🍌',
  'puto': '🍰', 'kwek-kwek': '🥚', 'bulalo': '🍖', 'tinolang manok': '🐔', 'munggo soup': '🫘',
  'tapsilog': '🥩', 'longsilog': '🌭', 'bangsilog': '🐟', 'tocilog': '🥓',
  "sago't gulaman": '🧋', 'calamansi juice': '🍋', 'buko juice': '🥥', 'iced coffee': '☕',
  'royal (orange)': '🥤',
};

function getFoodEmoji(name) {
  return FOOD_EMOJI[name.toLowerCase()] || '🍽️';
}

export default function Menu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const { addItem, items: cartItems } = useCart();

  useEffect(() => {
    const load = async () => {
      try {
        const [itemsRes, catsRes] = await Promise.all([
          api.get('/menu/items'),
          api.get('/menu/categories'),
        ]);
        setItems(itemsRes.data.data || itemsRes.data);
        setCategories(catsRes.data.data || catsRes.data);
      } catch {
        toast.error('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (activeCat !== 'all' && String(item.category_id) !== String(activeCat)) return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, activeCat, search]);

  const getCartQty = (id) => {
    const ci = cartItems.find((c) => c.item_id === id);
    return ci ? ci.quantity : 0;
  };

  const handleAdd = (item) => {
    addItem({
      item_id: item.item_id,
      name: item.name,
      price: parseFloat(item.base_price),
    });
    setAddedId(item.item_id);
    setTimeout(() => setAddedId(null), 800);
    toast.success(`${item.name} added to cart`, { duration: 1500, icon: '🛒' });
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-8 w-32 skeleton mb-2" />
          <div className="h-4 w-56 skeleton" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <div className="h-44 shimmer-bg" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-3/4 skeleton" />
                <div className="h-4 w-full skeleton" />
                <div className="flex justify-between">
                  <div className="h-6 w-16 skeleton" />
                  <div className="h-8 w-20 skeleton rounded-lg" />
                </div>
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Menu</h1>
        <p className="text-gray-500 text-sm mt-1">Browse and add items to your cart</p>
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white hover:border-gray-300"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveCat('all')}
          className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeCat === 'all'
              ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/25'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
          }`}
        >
          🍽️ All
        </button>
        {categories.map((c) => (
          <button
            key={c.category_id}
            onClick={() => setActiveCat(String(c.category_id))}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              String(activeCat) === String(c.category_id)
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/25'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-500 font-medium text-lg">No items found</p>
          <p className="text-gray-400 text-sm mt-1">Try a different category or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item, idx) => {
            const qty = getCartQty(item.item_id);
            const isAdding = addedId === item.item_id;
            return (
              <div
                key={item.item_id}
                className={`bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover group animate-fade-in-up cursor-pointer`}
                style={{ animationDelay: `${Math.min(idx * 0.05, 0.4)}s`, animationFillMode: 'both' }}
                onClick={() => setSelectedItem(item)}
              >
                {/* Image / Placeholder */}
                <div className="h-44 bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 flex items-center justify-center relative overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{getFoodEmoji(item.name)}</span>
                  )}
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {item.is_vegetarian ? (
                      <span className="inline-flex items-center gap-1 bg-green-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full glass">
                        <Leaf className="w-3 h-3" /> Veg
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-red-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full glass">
                        <Flame className="w-3 h-3" /> Non-veg
                      </span>
                    )}
                  </div>
                  {qty > 0 && (
                    <div className="absolute top-3 right-3 min-w-[28px] h-7 bg-brand-500 text-white rounded-full text-xs font-bold flex items-center justify-center px-2 shadow-lg shadow-brand-500/30 animate-scale-in">
                      {qty} in cart
                    </div>
                  )}
                  {/* Prep time */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/80 glass text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> {item.prep_time_minutes}min
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-lg group-hover:text-brand-600 transition-colors">{item.name}</h3>
                  {item.description && (
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <span className="text-xl font-bold text-brand-600">
                        ₱{parseFloat(item.base_price).toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAdd(item); }}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95 ${
                        isAdding
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                          : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/30'
                      }`}
                    >
                      {isAdding ? (
                        <>
                          <Check className="w-4 h-4" /> Added!
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" /> Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && createPortal(
        <ItemDetailModal
          item={selectedItem}
          cartQty={getCartQty(selectedItem.item_id)}
          onAdd={handleAdd}
          onClose={() => setSelectedItem(null)}
          getFoodEmoji={getFoodEmoji}
        />,
        document.body
      )}
    </div>
  );
}

function ItemDetailModal({ item, cartQty, onAdd, onClose, getFoodEmoji }) {
  const { updateQuantity, removeItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 800);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-overlay-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative h-56 sm:h-64 bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 flex items-center justify-center overflow-hidden">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl">{getFoodEmoji(item.name)}</span>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors glass"
          >
            <X className="w-5 h-5" />
          </button>
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {item.is_vegetarian ? (
              <span className="inline-flex items-center gap-1 bg-green-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full glass">
                <Leaf className="w-3 h-3" /> Vegetarian
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-red-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full glass">
                <Flame className="w-3 h-3" /> Non-veg
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{item.category_name}</p>
            </div>
            <span className="text-2xl font-bold text-brand-600 whitespace-nowrap">
              ₱{parseFloat(item.base_price).toFixed(2)}
            </span>
          </div>

          {item.description && (
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">{item.description}</p>
          )}

          {/* Info chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" /> {item.prep_time_minutes} min prep
            </div>
            {item.quantity_available != null && (
              <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                parseFloat(item.quantity_available) > 10
                  ? 'bg-green-50 text-green-700'
                  : parseFloat(item.quantity_available) > 0
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-red-50 text-red-700'
              }`}>
                {parseFloat(item.quantity_available) > 10 ? 'In Stock' : parseFloat(item.quantity_available) > 0 ? 'Low Stock' : 'Out of Stock'}
              </div>
            )}
          </div>

          {/* Cart controls */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            {cartQty > 0 ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (cartQty <= 1) removeItem(item.item_id);
                      else updateQuantity(item.item_id, cartQty - 1);
                    }}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-90"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-lg font-bold text-gray-900">{cartQty}</span>
                  <button
                    onClick={() => updateQuantity(item.item_id, cartQty + 1)}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-lg font-bold text-brand-600">
                  ₱{(parseFloat(item.base_price) * cartQty).toFixed(2)}
                </span>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 ${
                  added
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                    : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30'
                }`}
              >
                {added ? (
                  <><Check className="w-4 h-4" /> Added to Cart!</>
                ) : (
                  <><Plus className="w-4 h-4" /> Add to Cart — ₱{parseFloat(item.base_price).toFixed(2)}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
