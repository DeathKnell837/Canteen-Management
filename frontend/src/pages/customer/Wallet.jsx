import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet as WalletIcon, Plus, Sparkles, ShieldCheck, CheckCircle2, ArrowRightLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [balLoading, setBalLoading] = useState(true);
  const [flowStep, setFlowStep] = useState(1);
  const [lastTopup, setLastTopup] = useState(0);
  const [securityPin, setSecurityPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [hasPin, setHasPin] = useState(false);

  const loadBalance = async () => {
    try {
      const [res, pinRes] = await Promise.all([
        api.get('/payments/wallet/balance'),
        api.get('/payments/wallet/pin/status')
      ]);
      const data = res.data.data || res.data;
      setBalance(parseFloat(data.wallet_balance ?? data.balance ?? 0));
      setHasPin(!!pinRes.data?.data?.hasPin);
    } catch {
      toast.error('Failed to load balance');
    } finally {
      setBalLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const goToConfirm = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setFlowStep(2);
  };

  const handleTopup = async () => {
    const val = parseFloat(amount);

    if (!securityPin || !/^[0-9]{4,6}$/.test(securityPin)) {
      toast.error('Enter your 4 to 6 digit wallet PIN');
      return;
    }

    if (!window.confirm(`Confirm wallet top-up of ₱${val.toFixed(2)}?`)) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/payments/wallet/topup', { amount: val, securityPin });
      toast.success(`₱${val.toFixed(2)} added to wallet`);
      setLastTopup(val);
      setFlowStep(3);
      setAmount('');
      setSecurityPin('');
      await loadBalance();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Top-up failed');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000];

  const handleSetPin = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{4,6}$/.test(newPin)) {
      toast.error('PIN must be 4 to 6 digits');
      return;
    }

    try {
      await api.post('/payments/wallet/pin', { pin: newPin });
      toast.success(hasPin ? 'Wallet PIN updated' : 'Wallet PIN set');
      setHasPin(true);
      setNewPin('');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to set wallet PIN');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Wallet</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your wallet balance</p>
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
        <div className="card-glass rounded-3xl p-7 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
              <Plus className="w-4 h-4 text-brand-500" />
            </div>
            GCash-style Top-up
          </h2>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Step {flowStep} of 3: Enter amount → Confirm → Success</p>

          {flowStep === 1 && (
            <form onSubmit={goToConfirm}>
              <div className="relative mb-4 group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg group-focus-within:text-brand-500 transition-colors">₱</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all hover:border-gray-200 dark:hover:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
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
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shadow-sm shadow-brand-100 dark:shadow-brand-900/20'
                        : 'border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    ₱{qa}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-bold hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/25 hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {flowStep === 2 && (
            <div>
              <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-4 mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Payment Channel</p>
                <p className="font-semibold text-gray-900 dark:text-white">GCash</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Amount</p>
                <p className="text-2xl font-bold text-brand-600">₱{parseFloat(amount || 0).toFixed(2)}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Wallet PIN</label>
                <input
                  type="password"
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value)}
                  placeholder="Enter 4 to 6 digit PIN"
                  maxLength={6}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use your saved wallet PIN to authorize top-up.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFlowStep(1)}
                  className="py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleTopup}
                  disabled={loading}
                  className="py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          )}

          {flowStep === 3 && (
            <div className="text-center py-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top-up successful</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">₱{lastTopup.toFixed(2)} has been added to your wallet balance.</p>
              <button
                type="button"
                onClick={() => setFlowStep(1)}
                className="mt-4 px-4 py-2 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-semibold"
              >
                Top-up Again
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <form onSubmit={handleSetPin} className="card-glass rounded-2xl p-4">
          <p className="font-semibold text-gray-900 dark:text-white">{hasPin ? 'Update Wallet PIN' : 'Set Wallet PIN First'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Top-up requires a saved wallet PIN.</p>
          <div className="mt-3 flex gap-2">
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Enter 4 to 6 digit PIN"
              maxLength={6}
              className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white"
            />
            <button type="submit" className="px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600">
              Save PIN
            </button>
          </div>
        </form>

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

        {/* Info note */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-5 flex gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">How wallet works</p>
            <p className="text-sm text-blue-700/70 dark:text-blue-300/70 mt-1 leading-relaxed">
              Add money to your wallet and use it to pay for orders instantly. Wallet payments are processed immediately during checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
