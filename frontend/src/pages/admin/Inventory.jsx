import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Package, AlertTriangle, Plus, Minus, RefreshCw, X, Loader2, Trash2, Search } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stockModal, setStockModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');

  const loadInventory = async () => {
    try {
      const [invRes, menuRes, catRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/menu/items'),
        api.get('/menu/categories')
      ]);
      const invData = invRes.data.data || invRes.data || [];
      const menuData = menuRes.data.data || menuRes.data || [];
      const catData = catRes.data.data || catRes.data || [];

      const merged = invData.map(inv => {
        const menuItem = menuData.find(m => m.item_id === inv.item_id);
        const catId = menuItem?.category_id;
        const categoryMatch = catData.find(c => c.category_id === parseInt(catId));
        return {
          ...inv,
          category: categoryMatch ? categoryMatch.name : 'Uncategorized',
          item_name: menuItem?.name || inv.item_name
        };
      });

      setInventory(merged);
      setCategories(catData);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadInventory(); }, []);

  const filteredAndSorted = useMemo(() => {
    let result = [...inventory];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        (i.item_name || '').toLowerCase().includes(q) || 
        (i.category || '').toLowerCase().includes(q)
      );
    }

    if (filterCategory !== 'all') {
      result = result.filter(i => i.category === filterCategory);
    }

    result.sort((a, b) => {
      const nameA = (a.item_name || '').toLowerCase();
      const nameB = (b.item_name || '').toLowerCase();
      const stockA = parseFloat(a.quantity || 0);
      const stockB = parseFloat(b.quantity || 0);
      const dateA = new Date(a.last_updated || 0).getTime();
      const dateB = new Date(b.last_updated || 0).getTime();

      switch (sortBy) {
        case 'name_asc': return nameA.localeCompare(nameB);
        case 'name_desc': return nameB.localeCompare(nameA);
        case 'stock_asc': return stockA - stockB;
        case 'stock_desc': return stockB - stockA;
        case 'date_desc': return dateB - dateA;
        case 'date_asc': return dateA - dateB;
        default: return 0;
      }
    });

    return result;
  }, [inventory, searchQuery, filterCategory, sortBy]);

  const handleDeleteInventoryItem = async (item) => {
    const itemName = item?.item_name || `Item #${item?.item_id}`;
    const ok = window.confirm(`Delete ${itemName} from inventory?`);
    if (!ok) return;

    try {
      await api.delete(`/inventory/items/${item.item_id}`);
      toast.success('Inventory item deleted');
      loadInventory();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.response?.data?.error || err.response?.data?.message;

      // Backward-compatible fallback for older backend route sets.
      if (status === 404 || /endpoint not found/i.test(String(msg || ''))) {
        try {
          await api.delete(`/menu/items/${item.item_id}`);
          toast.success('Item removed from menu and inventory');
          loadInventory();
          return;
        } catch (fallbackErr) {
          toast.error(
            fallbackErr.response?.data?.error?.message ||
            fallbackErr.response?.data?.error ||
            fallbackErr.response?.data?.message ||
            'Failed to delete inventory item'
          );
          return;
        }
      }

      toast.error(msg || 'Failed to delete inventory item');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 skeleton rounded-lg" />
          <div className="h-10 w-28 skeleton rounded-xl" />
        </div>
        <div className="skeleton rounded-2xl h-16" />
        <div className="skeleton rounded-2xl h-80" />
      </div>
    );
  }

  const lowCount = inventory.filter((i) => parseFloat(i.quantity) < 10).length;
  const maxQty = Math.max(...inventory.map((i) => parseFloat(i.quantity)), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{inventory.length} items tracked</p>
        </div>
        <button
          onClick={() => { setRefreshing(true); loadInventory(); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600 transition-all active:scale-[0.97]"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inventory items or categories..."
            className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide shrink-0">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none min-w-[140px]"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.category_id} value={c.name}>{c.name}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none min-w-[170px]"
          >
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="stock_asc">Stock (Low Ext)</option>
            <option value="stock_desc">Stock (High Ext)</option>
            <option value="date_desc">Updated (Newest)</option>
            <option value="date_asc">Updated (Oldest)</option>
          </select>
        </div>
      </div>

      {/* Low stock alert */}
      {lowCount > 0 && (
        <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-5 flex items-center gap-4 animate-fade-in-up">
          <div className="flex-shrink-0 w-11 h-11 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center relative">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] items-center justify-center font-bold">{lowCount}</span>
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-red-900 dark:text-red-200">{lowCount} item{lowCount > 1 ? 's' : ''} low on stock</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">Items with less than 10 units remaining need restocking</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-glass rounded-2xl shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-800/80">
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Item</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Stock Level</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Status</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Last Updated</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredAndSorted.map((inv) => {
                const qty = parseFloat(inv.quantity);
                const isLow = qty < 10;
                const pct = Math.min((qty / maxQty) * 100, 100);
                return (
                  <tr key={inv.item_id} className={`hover:bg-brand-50/30 dark:hover:bg-white/5 transition-colors group ${isLow ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${isLow ? 'bg-gradient-to-br from-red-50 to-red-100' : 'bg-gradient-to-br from-brand-50 to-brand-100'}`}>
                          <Package className={`w-4 h-4 ${isLow ? 'text-red-500' : 'text-brand-500'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{inv.item_name || `Item #${inv.item_id}`}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{inv.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 min-w-[140px]">
                        <span className={`text-sm font-bold ${isLow ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                          {qty}
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-brand-400 to-brand-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                      {inv.last_updated
                        ? new Date(inv.last_updated).toLocaleDateString('en-PH', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setStockModal({ item: inv, type: 'in' })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-all border border-green-200/50 active:scale-[0.97]"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                        <button
                          onClick={() => setStockModal({ item: inv, type: 'out' })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-all border border-red-200/50 active:scale-[0.97]"
                        >
                          <Minus className="w-3 h-3" /> Remove
                        </button>
                        <button
                          onClick={() => handleDeleteInventoryItem(inv)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-all border border-red-200/50 active:scale-[0.97]"
                          title="Delete item from inventory"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAndSorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Package className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No inventory data</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock modal */}
      {stockModal && createPortal(
        <StockModal
          item={stockModal.item}
          type={stockModal.type}
          onClose={() => setStockModal(null)}
          onDone={() => {
            setStockModal(null);
            loadInventory();
          }}
        />,
        document.body
      )}
    </div>
  );
}

function StockModal({ item, type, onClose, onDone }) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const isIn = type === 'in';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseInt(quantity);
    if (!val || val <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/inventory/items/${item.item_id}/stock-${type}`, {
        quantity: val,
        reason: reason || undefined,
      });
      toast.success(`Stock ${isIn ? 'added' : 'removed'} successfully`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all hover:border-gray-200 dark:hover:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-overlay-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm shadow-2xl animate-modal-in">
        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              <span className="inline-flex items-center gap-1.5">{isIn ? <><Package className="w-4 h-4" /> Add Stock</> : <><Package className="w-4 h-4" /> Remove Stock</>}</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.item_name || `Item #${item.item_id}`}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="1"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Restocking delivery"
              className={inputClass}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98]">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className={`flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all shadow-lg active:scale-[0.98] inline-flex items-center justify-center gap-2 ${
                isIn ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/20 hover:from-green-600 hover:to-green-700' : 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/20 hover:from-red-600 hover:to-red-700'
              }`}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Saving...' : isIn ? 'Add Stock' : 'Remove Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
