import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Save, UtensilsCrossed, Search, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);

  const loadData = async () => {
    try {
      const [iRes, cRes] = await Promise.all([
        api.get('/menu/items'),
        api.get('/menu/categories'),
      ]);
      setItems(iRes.data.data || iRes.data);
      setCategories(cRes.data.data || cRes.data);
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/menu/items/${id}`);
      toast.success('Item deleted');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Delete failed');
    }
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const getCatName = (id) => {
    const c = categories.find((cat) => cat.category_id === id);
    return c ? c.name : '—';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 skeleton rounded-lg" />
          <div className="h-10 w-32 skeleton rounded-xl" />
        </div>
        <div className="h-10 w-full skeleton rounded-xl" />
        <div className="skeleton rounded-2xl h-80" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} items total</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/20 active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 animate-fade-in-up" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all hover:border-gray-200"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase text-left">Item</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase text-left">Category</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase text-left">Price</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase text-left">Available</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item, idx) => (
                <tr key={item.item_id} className="hover:bg-brand-50/30 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-50 to-brand-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <UtensilsCrossed className="w-4 h-4 text-brand-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-400 truncate max-w-xs">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg">
                      {getCatName(item.category_id)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-gray-900">₱{parseFloat(item.base_price).toFixed(2)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.is_active !== false ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                      {item.is_active !== false ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setModal(item)}
                        className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.item_id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="text-3xl mb-2">🍽️</div>
                    <p className="text-gray-400 text-sm">No items found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal !== null && (
        <ItemModal
          item={modal === 'add' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function ItemModal({ item, categories, onClose, onSaved }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item ? String(parseFloat(item.base_price)) : '',
    category_id: item?.category_id || (categories[0]?.category_id || ''),
    is_vegetarian: item?.is_vegetarian ?? true,
    preparation_time: item?.prep_time_minutes || 10,
  });
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [field]: val });
  };

  const inputClass = 'w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all hover:border-gray-200';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        categoryId: parseInt(form.category_id),
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        isVegetarian: form.is_vegetarian,
        prepTime: parseInt(form.preparation_time),
      };
      if (isEdit) {
        await api.put(`/menu/items/${item.item_id}`, payload);
        toast.success('Item updated');
      } else {
        await api.post('/menu/items', payload);
        toast.success('Item created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-overlay-in">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-modal-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-50">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
            <input value={form.name} onChange={set('name')} required minLength={2} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price (₱)</label>
              <input type="number" value={form.price} onChange={set('price')} required min="0" step="0.01" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
              <select value={form.category_id} onChange={set('category_id')} className={`${inputClass} bg-white`}>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prep Time (min)</label>
            <input type="number" value={form.preparation_time} onChange={set('preparation_time')} min="1" className={inputClass} />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.is_vegetarian} onChange={set('is_vegetarian')}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 w-4 h-4" />
              Vegetarian
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all active:scale-[0.98]">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl text-sm font-bold hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 transition-all shadow-lg shadow-brand-500/20 active:scale-[0.98] inline-flex items-center justify-center gap-2">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
