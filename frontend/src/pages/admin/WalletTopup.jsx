import { useState, useEffect, useCallback } from 'react';
import { Search, Wallet, Plus, CheckCircle2, User, ArrowRightLeft, Loader2, History } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

function getAvatarSrc(raw) {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return raw;
  return `/${raw}`;
}

function CustomerAvatar({ customer, size = 'md' }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [customer?.profile_picture_url]);

  const src = getAvatarSrc(customer?.profile_picture_url);
  const sizeClass = size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const iconClass = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800 dark:to-emerald-900 flex items-center justify-center overflow-hidden`}>
      {src && !failed ? (
        <img
          src={src}
          alt={customer?.full_name || 'Customer'}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <User className={`${iconClass} text-emerald-600 dark:text-emerald-300`} />
      )}
    </div>
  );
}

export default function WalletTopup() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState({});
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('topup'); // 'topup' | 'history'

  // Load top-up history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/admin/wallet/topup/history?limit=50');
        setHistory(res.data.data || { topups: [], total_collected: 0 });
      } catch {
        // silent
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [success]);

  // Debounced customer search
  useEffect(() => {
    if (search.trim().length < 2) {
      setCustomers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/admin/wallet/customers/search?q=${encodeURIComponent(search)}`);
        setCustomers(res.data.data || []);
      } catch {
        setCustomers([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSelectCustomer = (customer) => {
    setSelected(customer);
    setSearch('');
    setCustomers([]);
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    setErrors({});
    const val = parseFloat(amount);
    let newErrors = {};
    if (!val || val <= 0) newErrors.amount = 'Enter a valid amount greater than 0';
    if (!selected) newErrors.selected = 'Select a customer first';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (!window.confirm(`Confirm: Credit ₱${val.toFixed(2)} to ${selected.full_name}'s wallet?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/admin/wallet/topup', {
        userId: selected.user_id,
        amount: val,
        note: note || undefined
      });
      setSuccess({
        name: selected.full_name,
        amount: val,
        newBalance: res.data.data.new_balance
      });
      setAmount('');
      setNote('');
      setSelected(null);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Top-up failed');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [50, 100, 200, 500, 1000];

  return (
    <div>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          Wallet Top-Up
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Credit customer wallets after receiving cash payment</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('topup')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-1.5 ${
            activeTab === 'topup'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-600 dark:text-gray-300 border border-white/50 dark:border-gray-700'
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> New Top-Up
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-600 dark:text-gray-300 border border-white/50 dark:border-gray-700'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Top-Up History
        </button>
      </div>

      {activeTab === 'topup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-fade-in-up">
          {/* Left: Search & Select Customer */}
          <div className="space-y-4">
            <div className="card-glass rounded-2xl p-5">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-500" />
                Step 1: Find Customer
              </h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                />
                {searching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>

              {/* Search Results */}
              {customers.length > 0 && (
                <div className="mt-3 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-50 dark:divide-gray-800 max-h-60 overflow-y-auto">
                  {customers.map((c) => (
                    <button
                      key={c.user_id}
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors text-left"
                    >
                      <CustomerAvatar customer={c} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.email}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">₱{parseFloat(c.wallet_balance).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}

              {search.trim().length >= 2 && !searching && customers.length === 0 && (
                <p className="mt-3 text-sm text-gray-400 text-center py-3">No customers found</p>
              )}
            </div>

            {/* Selected Customer Card */}
            {selected && (
              <div className="card-glass rounded-2xl p-5 border-2 border-emerald-200 dark:border-emerald-800 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CustomerAvatar customer={selected} size="lg" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{selected.full_name}</p>
                      <p className="text-xs text-gray-400">{selected.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Current Balance</p>
                    <p className="text-lg font-bold text-emerald-600">₱{parseFloat(selected.wallet_balance).toFixed(2)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="mt-3 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Change customer
                </button>
              </div>
            )}
          </div>

          {/* Right: Amount & Confirm */}
          <div className="space-y-4">
            <form onSubmit={handleTopup} className="card-glass rounded-2xl p-5">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                Step 2: Enter Cash Amount
              </h2>

              <div className="relative mb-2 group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg group-focus-within:text-emerald-500 transition-colors">₱</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); if(errors.amount) setErrors({...errors, amount: null}); }}
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  className={`w-full pl-10 pr-4 py-3.5 border-2 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:bg-gray-800 dark:text-white ${errors.amount ? 'border-red-500' : 'border-gray-100 dark:border-gray-700'}`}
                />
              </div>
              {errors.amount && <p className="mb-4 text-xs text-red-500">{errors.amount}</p>}

              <div className="flex gap-2 mb-5 flex-wrap">
                {quickAmounts.map((qa) => (
                  <button
                    key={qa}
                    type="button"
                    onClick={() => setAmount(String(qa))}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 ${
                      amount === String(qa)
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'
                    }`}
                  >
                    ₱{qa}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Note (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., Cash received at counter"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !selected}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                {loading ? 'Processing...' : 'Confirm Cash Top-Up'}
              </button>

              {!selected && (
                <p className="text-xs text-amber-500 mt-2 text-center">← Select a customer first</p>
              )}
            </form>

            {/* Success Result */}
            {success && (
              <div className="card-glass rounded-2xl p-5 text-center animate-fade-in-up border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Top-Up Successful</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  ₱{success.amount.toFixed(2)} credited to <strong>{success.name}</strong>
                </p>
                <p className="text-sm text-emerald-600 font-semibold mt-2">
                  New Balance: ₱{parseFloat(success.newBalance).toFixed(2)}
                </p>
                <button
                  onClick={() => setSuccess(null)}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold text-sm"
                >
                  Top-Up Another
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="animate-fade-in-up">
          {/* Total collected card */}
          {history.total_collected > 0 && (
            <div className="card-glass rounded-2xl p-5 mb-6 flex items-center gap-4">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Cash Collected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₱{parseFloat(history.total_collected).toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* History table */}
          <div className="table-glass rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-800/80">
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Customer</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Amount</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Admin</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Note</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center">
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : (history.topups || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center">
                        <Wallet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No top-up history yet</p>
                      </td>
                    </tr>
                  ) : (
                    (history.topups || []).map((t) => (
                      <tr key={t.topup_id} className="hover:bg-emerald-50/30 dark:hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.customer_name}</p>
                            <p className="text-xs text-gray-400">{t.customer_email}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold text-emerald-600">+₱{parseFloat(t.amount).toFixed(2)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{t.admin_name}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-400 max-w-[200px] truncate">{t.note || '—'}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(t.created_at).toLocaleDateString('en-PH', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
