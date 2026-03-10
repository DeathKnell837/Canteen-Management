import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Plus, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [balLoading, setBalLoading] = useState(true);

  const loadBalance = async () => {
    try {
      const res = await api.get('/payments/wallet/balance');
      const data = res.data.data || res.data;
      setBalance(parseFloat(data.wallet_balance ?? data.balance ?? 0));
    } catch {
      toast.error('Failed to load balance');
    } finally {
      setBalLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const handleTopup = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      await api.post('/payments/wallet/topup', { amount: val });
      toast.success(`₱${val.toFixed(2)} added to wallet 🎉`);
      setAmount('');
      loadBalance();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Top-up failed');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your wallet balance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance card */}
        <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 rounded-3xl p-7 text-white relative overflow-hidden shadow-xl shadow-brand-500/20 animate-fade-in-up">
          {/* Decorative shapes */}
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute left-1/2 top-0 w-16 h-16 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 glass flex items-center justify-center">
                <WalletIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-white/70 font-medium">Available Balance</span>
            </div>
            {balLoading ? (
              <div className="h-12 w-40 bg-white/20 rounded-lg animate-pulse mt-3" />
            ) : (
              <div className="flex items-baseline mt-3 number-pop">
                <span className="text-3xl font-bold opacity-70">₱</span>
                <span className="text-5xl font-bold ml-1 tracking-tight">{balance.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-4 text-white/50 text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secured wallet balance
            </div>
          </div>
        </div>

        {/* Top-up card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-7 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <Plus className="w-4 h-4 text-brand-500" />
            </div>
            Add Money
          </h2>
          <form onSubmit={handleTopup}>
            <div className="relative mb-4 group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg group-focus-within:text-brand-500 transition-colors">₱</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                step="0.01"
                className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all hover:border-gray-200"
              />
            </div>
            <div className="flex gap-2 mb-5 flex-wrap">
              {quickAmounts.map((qa) => (
                <button
                  key={qa}
                  type="button"
                  onClick={() => setAmount(String(qa))}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 ${
                    amount === String(qa)
                      ? 'border-brand-500 bg-brand-50 text-brand-600 shadow-sm shadow-brand-100'
                      : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  ₱{qa}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-bold hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/25 hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Add to Wallet
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Info note */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 flex gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-900">How wallet works</p>
          <p className="text-sm text-blue-700/70 mt-1 leading-relaxed">
            Add money to your wallet and use it to pay for orders instantly. Wallet payments are processed immediately during checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
