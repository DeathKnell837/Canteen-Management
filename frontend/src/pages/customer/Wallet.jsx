import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [balLoading, setBalLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

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
      toast.success(`₱${val.toFixed(2)} added to wallet`);
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
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your wallet balance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance card */}
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -right-2 bottom-0 w-20 h-20 rounded-full bg-white/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <WalletIcon className="w-5 h-5 text-white/80" />
              <span className="text-sm text-white/80">Available Balance</span>
            </div>
            {balLoading ? (
              <div className="h-10 w-32 bg-white/20 rounded animate-pulse mt-2" />
            ) : (
              <div className="flex items-baseline mt-2">
                <span className="text-3xl font-bold">₱</span>
                <span className="text-4xl font-bold ml-1">{balance.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Top-up card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-500" />
            Add Money
          </h2>
          <form onSubmit={handleTopup}>
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₱</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                step="0.01"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {quickAmounts.map((qa) => (
                <button
                  key={qa}
                  type="button"
                  onClick={() => setAmount(String(qa))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    amount === String(qa)
                      ? 'border-brand-500 bg-brand-50 text-brand-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  ₱{qa}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Add to Wallet'}
            </button>
          </form>
        </div>
      </div>

      {/* Info note */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <WalletIcon className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-900">How wallet works</p>
          <p className="text-sm text-blue-700 mt-1">
            Add money to your wallet and use it to pay for orders instantly. Wallet payments are processed immediately during checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
