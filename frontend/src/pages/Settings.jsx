import { useEffect, useState } from 'react';
import { Moon, Sun, Shield, KeyRound } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Settings() {
  const { dark, toggle } = useTheme();
  const { user } = useAuth();
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);

  const isCustomer = user?.role === 'CUSTOMER';

  useEffect(() => {
    if (!isCustomer) return;

    const load = async () => {
      try {
        const res = await api.get('/payments/wallet/pin/status');
        setHasPin(!!res.data?.data?.hasPin);
      } catch {
        // ignore status loading errors here
      }
    };

    load();
  }, [isCustomer]);

  const handleSavePin = async (e) => {
    e.preventDefault();

    if (!/^[0-9]{4,6}$/.test(pin)) {
      toast.error('PIN must be 4 to 6 digits');
      return;
    }

    if (pin !== confirmPin) {
      toast.error('PIN confirmation does not match');
      return;
    }

    setSaving(true);
    try {
      await api.post('/payments/wallet/pin', { pin });
      toast.success(hasPin ? 'Wallet PIN updated' : 'Wallet PIN set');
      setHasPin(true);
      setPin('');
      setConfirmPin('');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save wallet PIN');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your preferences and account security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-glass rounded-2xl p-5">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-500" />
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Theme</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Switch between light and dark mode</p>
            </div>
            <button
              onClick={toggle}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>

        {isCustomer && (
          <form onSubmit={handleSavePin} className="card-glass rounded-2xl p-5">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-brand-500" />
              Wallet PIN
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {hasPin ? 'Your wallet PIN is set. You can update it below.' : 'Set your wallet PIN to secure wallet top-ups.'}
            </p>
            <div className="space-y-3">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="New PIN (4 to 6 digits)"
                maxLength={6}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white"
              />
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirm PIN"
                maxLength={6}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-4 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : hasPin ? 'Update PIN' : 'Set PIN'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
