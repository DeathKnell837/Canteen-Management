import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet as WalletIcon, ShieldCheck, ArrowRightLeft, ChevronRight, Sparkles, Info } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [balLoading, setBalLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [res, txRes] = await Promise.all([
          api.get('/payments/wallet/balance'),
          api.get('/payments/wallet/transactions?limit=20')
        ]);
        const data = res.data.data || res.data;
        setBalance(parseFloat(data.wallet_balance ?? data.balance ?? 0));
        setTransactions(txRes.data.data || []);
      } catch {
        toast.error('Failed to load balance');
      } finally {
        setBalLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Wallet</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Your wallet balance and transactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          {/* Balance card */}
          <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 rounded-3xl p-7 text-white relative overflow-hidden shadow-xl shadow-brand-500/20 animate-fade-in-up">
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

          {/* Top-up info card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-5 flex gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">How to top-up?</p>
              <p className="text-sm text-blue-700/70 dark:text-blue-300/70 mt-1 leading-relaxed">
                Visit the canteen counter and hand your cash to the admin. They will credit your wallet balance instantly.
              </p>
            </div>
          </div>

          <Link
            to="/cart"
            className="card-glass rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Order & Pay</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Use wallet balance or pay with cash</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>

          <Link
            to="/transactions"
            className="card-glass rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Transaction History</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">View top-ups and purchases</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>

        {/* Recent Transactions */}
        <div className="card-glass rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
          </div>
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-gray-500 dark:text-gray-400 text-sm">No transactions yet</div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.transaction_id} className="p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{tx.description || tx.transaction_type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString('en-PH', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${parseFloat(tx.amount) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {parseFloat(tx.amount) >= 0 ? '+' : ''}₱{Math.abs(parseFloat(tx.amount)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
