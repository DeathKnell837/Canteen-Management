import { useEffect, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, ReceiptText, Wallet, Clock3 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

function formatType(type) {
  if (type === 'TOPUP') return 'Top-up';
  if (type === 'PURCHASE') return 'Purchase';
  if (type === 'DIRECT_CASH' || type === 'CASH') return 'Direct Cash Payment';
  return type || 'Transaction';
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const walletTransactions = transactions.filter((tx) => tx.transaction_type !== 'DIRECT_CASH' && tx.transaction_type !== 'CASH');
  const cashTransactions = transactions.filter((tx) => tx.transaction_type === 'DIRECT_CASH' || tx.transaction_type === 'CASH');

  const renderTransactionList = (list) => (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {list.map((tx) => {
        const amount = parseFloat(tx.amount || 0);
        const isTopup = amount >= 0;
        const hasBalance = tx.balance_after !== null && tx.balance_after !== undefined;
        return (
          <div key={tx.transaction_id} className="p-4 sm:p-5 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isTopup ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                {isTopup ? (
                  <ArrowDownCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ArrowUpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{formatType(tx.transaction_type)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tx.description || 'Wallet transaction'}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                  <span className="inline-flex items-center gap-1"><Clock3 className="w-3 h-3" />{new Date(tx.created_at).toLocaleString('en-PH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  {tx.reference_id && <span>Ref: {tx.reference_id}</span>}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className={`font-bold ${isTopup ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isTopup ? '+' : '-'}₱{Math.abs(amount).toFixed(2)}
              </p>
              {hasBalance && (
                <p className="text-xs text-gray-400 dark:text-gray-500 inline-flex items-center gap-1 justify-end mt-1">
                  <Wallet className="w-3 h-3" />
                  Balance: ₱{parseFloat(tx.balance_after || 0).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/payments/wallet/transactions');
        setTransactions(res.data.data || []);
      } catch {
        toast.error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Transaction History</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">View your wallet top-ups and purchases</p>
      </div>

      <div className="card-glass rounded-2xl overflow-hidden mb-5">
        {loading ? (
          <div className="p-12 text-center text-gray-400 dark:text-gray-500">Loading transactions...</div>
        ) : walletTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <ReceiptText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No wallet transactions yet</p>
          </div>
        ) : (
          renderTransactionList(walletTransactions)
        )}
      </div>

      <div className="card-glass rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Direct Cash Transactions</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-400 dark:text-gray-500">Loading transactions...</div>
        ) : cashTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <ReceiptText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No direct cash transactions yet</p>
          </div>
        ) : (
          renderTransactionList(cashTransactions)
        )}
      </div>
    </div>
  );
}
