import { useState, useEffect, useRef } from 'react';
import { BarChart3, Package, ArrowRightLeft, UtensilsCrossed, Users, ClipboardList, Wallet, CalendarDays, Printer, Download, Loader2, TrendingUp, TrendingDown, AlertTriangle, Clock } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'sales', label: 'Sales', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
  { id: 'inventory', label: 'Inventory', icon: Package, color: 'from-amber-500 to-amber-600' },
  { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft, color: 'from-violet-500 to-violet-600' },
  { id: 'menu', label: 'Menu Performance', icon: UtensilsCrossed, color: 'from-pink-500 to-pink-600' },
  { id: 'customers', label: 'Customers', icon: Users, color: 'from-cyan-500 to-cyan-600' },
  { id: 'orders', label: 'Order Analytics', icon: ClipboardList, color: 'from-orange-500 to-orange-600' },
  { id: 'cash', label: 'Cash Collection', icon: Wallet, color: 'from-emerald-500 to-emerald-600' },
];

const PERIODS = [
  { val: 'all', label: 'All Time' },
  { val: 'today', label: 'Today' },
  { val: 'week', label: 'This Week' },
  { val: 'month', label: 'This Month' },
  { val: 'year', label: 'This Year' },
];

function getDateRange(period) {
  const now = new Date();
  let start;
  switch (period) {
    case 'today': start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
    case 'week': { const d = now.getDay(); start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d); break; }
    case 'month': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case 'year': start = new Date(now.getFullYear(), 0, 1); break;
    default: return {};
  }
  return { startDate: start.toISOString(), endDate: now.toISOString() };
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [period, setPeriod] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printSections, setPrintSections] = useState({
    sales: true, inventory: true, transactions: true, menu: true, customers: true, orders: true, cash: true
  });
  const printRef = useRef(null);

  const endpoints = {
    sales: '/reports/sales',
    inventory: '/reports/inventory',
    transactions: '/reports/transactions',
    menu: '/reports/menu-performance',
    customers: '/reports/customers',
    orders: '/reports/order-analytics',
    cash: '/reports/cash-collection',
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const range = getDateRange(period);
        if (range.startDate) params.append('startDate', range.startDate);
        if (range.endDate) params.append('endDate', range.endDate);
        const res = await api.get(`${endpoints[activeTab]}?${params.toString()}`);
        setData(res.data.data);
      } catch { toast.error('Failed to load report'); }
      finally { setLoading(false); }
    };
    load();
  }, [activeTab, period]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Report - ${TABS.find(t=>t.id===activeTab)?.label}</title>
      <style>body{font-family:system-ui,sans-serif;padding:20px;color:#111}table{width:100%;border-collapse:collapse;margin:10px 0}
      th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;font-size:13px}th{background:#f9fafb;font-weight:600;text-transform:uppercase;font-size:11px;color:#6b7280}
      h2{margin:20px 0 10px;font-size:16px}h3{font-size:14px;margin:15px 0 8px}.stat{display:inline-block;margin-right:30px;margin-bottom:10px}
      .stat-label{font-size:11px;color:#6b7280}.stat-value{font-size:20px;font-weight:700}@media print{body{padding:0}}</style></head><body>
      <h1>R&R Canteen - ${TABS.find(t=>t.id===activeTab)?.label} Report</h1>
      <p style="color:#6b7280;font-size:12px">Period: ${PERIODS.find(p=>p.val===period)?.label} | Generated: ${new Date().toLocaleString('en-PH')}</p>
      ${content.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  const handleCSV = () => {
    if (!data) return;
    let csv = '';
    const tab = activeTab;
    if (tab === 'sales' && data.daily) {
      csv = 'Date,Orders,Revenue\n' + data.daily.map(d => `${d.date},${d.orders},${d.revenue}`).join('\n');
    } else if (tab === 'inventory' && data.items) {
      csv = 'Item,Category,Stock,Reorder Level,Low Stock\n' + data.items.map(i => `"${i.name}","${i.category}",${i.quantity_available},${i.reorder_level},${i.is_low_stock}`).join('\n');
    } else if (tab === 'transactions' && data.transactions) {
      csv = 'Date,Customer,Type,Amount,Description\n' + data.transactions.map(t => `${new Date(t.created_at).toLocaleDateString()},"${t.customer_name}",${t.transaction_type},${t.amount},"${t.description || ''}"`).join('\n');
    } else if (tab === 'menu' && data.bestSellers) {
      csv = 'Item,Category,Units Sold,Revenue\n' + data.bestSellers.map(i => `"${i.name}","${i.category}",${i.units_sold},${i.revenue}`).join('\n');
    } else if (tab === 'customers' && data.topSpenders) {
      csv = 'Name,Email,Orders,Total Spent,Balance\n' + data.topSpenders.map(c => `"${c.full_name}","${c.email}",${c.order_count},${c.total_spent},${c.wallet_balance}`).join('\n');
    } else if (tab === 'orders' && data.byStatus) {
      csv = 'Status,Count\n' + data.byStatus.map(s => `${s.status},${s.count}`).join('\n');
    } else if (tab === 'cash' && data.daily) {
      csv = 'Date,Collected,Top-ups\n' + data.daily.map(d => `${d.date},${d.collected},${d.topups}`).join('\n');
    }
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${tab}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const StatCard = ({ label, value, icon: Icon, color = 'text-brand-500' }) => (
    <div className="card-glass rounded-xl px-4 py-3 flex items-center gap-3 min-w-[140px]">
      <Icon className={`w-5 h-5 ${color}`} />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            Reports
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Comprehensive analytics across your canteen</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all" title="Print">
            <Printer className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={handleCSV} className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all" title="Export CSV">
            <Download className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-3 mb-4 animate-fade-in-up" style={{ animationDelay: '0.03s', animationFillMode: 'both' }}>
        <CalendarDays className="w-4 h-4 text-gray-400" />
        <div className="flex gap-1.5 flex-wrap">
          {PERIODS.map(p => (
            <button key={p.val} onClick={() => setPeriod(p.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p.val ? 'bg-brand-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >{p.label}</button>
          ))}
        </div>
      </div>

      {/* Report tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide animate-fade-in-up" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                  : 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-600 dark:text-gray-300 border border-white/50 dark:border-gray-700'
              }`}
            ><Icon className="w-3.5 h-3.5" /> {tab.label}</button>
          );
        })}
      </div>

      {/* Report Content */}
      <div ref={printRef} className="animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-gray-400 animate-spin" /></div>
        ) : !data ? (
          <p className="text-center text-gray-400 py-20">No data available</p>
        ) : (
          <>
            {activeTab === 'sales' && <SalesReport data={data} StatCard={StatCard} />}
            {activeTab === 'inventory' && <InventoryReport data={data} StatCard={StatCard} />}
            {activeTab === 'transactions' && <TransactionReport data={data} StatCard={StatCard} />}
            {activeTab === 'menu' && <MenuReport data={data} StatCard={StatCard} />}
            {activeTab === 'customers' && <CustomerReport data={data} StatCard={StatCard} />}
            {activeTab === 'orders' && <OrderReport data={data} StatCard={StatCard} />}
            {activeTab === 'cash' && <CashReport data={data} StatCard={StatCard} />}
          </>
        )}
      </div>
    </div>
  );
}

function SalesReport({ data, StatCard }) {
  const s = data.summary || {};
  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <StatCard label="Total Orders" value={s.total_orders || 0} icon={ClipboardList} color="text-blue-500" />
        <StatCard label="Successful" value={s.successful_orders || 0} icon={TrendingUp} color="text-green-500" />
        <StatCard label="Revenue" value={`₱${parseFloat(s.total_revenue || 0).toFixed(2)}`} icon={Wallet} color="text-emerald-500" />
        <StatCard label="Avg Order" value={`₱${parseFloat(s.avg_order_value || 0).toFixed(2)}`} icon={BarChart3} color="text-violet-500" />
      </div>
      {data.daily?.length > 0 && (
        <div className="table-glass rounded-2xl overflow-hidden">
          <h3 className="px-5 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">Daily Breakdown</h3>
          <table className="w-full"><thead><tr className="bg-gray-50/80 dark:bg-gray-800/80"><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Date</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Orders</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Revenue</th></tr></thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">{data.daily.map((d,i) => (
            <tr key={i} className="hover:bg-blue-50/30 dark:hover:bg-white/5"><td className="px-5 py-3 text-sm">{new Date(d.date).toLocaleDateString('en-PH',{day:'numeric',month:'short',year:'numeric'})}</td><td className="px-5 py-3 text-sm font-semibold">{d.orders}</td><td className="px-5 py-3 text-sm font-bold text-emerald-600">₱{parseFloat(d.revenue).toFixed(2)}</td></tr>
          ))}</tbody></table>
        </div>
      )}
    </div>
  );
}

function InventoryReport({ data, StatCard }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <StatCard label="Total Items" value={data.total_items || 0} icon={Package} color="text-amber-500" />
        <StatCard label="Low Stock" value={data.low_stock_count || 0} icon={AlertTriangle} color="text-red-500" />
      </div>
      <div className="table-glass rounded-2xl overflow-hidden">
        <table className="w-full"><thead><tr className="bg-gray-50/80 dark:bg-gray-800/80"><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Item</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Category</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Stock</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Reorder</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Status</th></tr></thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">{(data.items||[]).map(i => (
          <tr key={i.item_id} className="hover:bg-amber-50/30 dark:hover:bg-white/5"><td className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white">{i.name}</td><td className="px-5 py-3 text-xs text-gray-500">{i.category}</td><td className="px-5 py-3 text-sm font-bold">{i.quantity_available}</td><td className="px-5 py-3 text-sm text-gray-400">{i.reorder_level}</td>
          <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${i.is_low_stock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{i.is_low_stock ? 'Low' : 'OK'}</span></td></tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}

function TransactionReport({ data, StatCard }) {
  const s = data.summary || {};
  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <StatCard label="Total Top-ups" value={`₱${parseFloat(s.total_topups || 0).toFixed(2)}`} icon={TrendingUp} color="text-green-500" />
        <StatCard label="Total Purchases" value={`₱${parseFloat(s.total_purchases || 0).toFixed(2)}`} icon={TrendingDown} color="text-red-500" />
        <StatCard label="Transactions" value={s.total_transactions || 0} icon={ArrowRightLeft} color="text-violet-500" />
      </div>
      {data.byMethod?.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {data.byMethod.map(m => (
            <div key={m.transaction_type} className="card-glass rounded-xl px-4 py-3"><p className="text-xs text-gray-400">{m.transaction_type}</p><p className="text-sm font-bold text-gray-900 dark:text-white">{m.count} txns · ₱{parseFloat(m.total).toFixed(2)}</p></div>
          ))}
        </div>
      )}
      <div className="table-glass rounded-2xl overflow-hidden">
        <table className="w-full"><thead><tr className="bg-gray-50/80 dark:bg-gray-800/80"><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Date</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Customer</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Type</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Amount</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Description</th></tr></thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">{(data.transactions||[]).slice(0,50).map(t => (
          <tr key={t.transaction_id} className="hover:bg-violet-50/30 dark:hover:bg-white/5">
            <td className="px-5 py-3 text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString('en-PH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
            <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{t.customer_name}</td>
            <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${t.transaction_type==='TOPUP'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{t.transaction_type}</span></td>
            <td className={`px-5 py-3 text-sm font-bold ${parseFloat(t.amount)>=0?'text-emerald-600':'text-red-500'}`}>{parseFloat(t.amount)>=0?'+':''}₱{Math.abs(parseFloat(t.amount)).toFixed(2)}</td>
            <td className="px-5 py-3 text-xs text-gray-400 max-w-[200px] truncate">{t.description||'—'}</td>
          </tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}

function MenuReport({ data, StatCard }) {
  return (
    <div className="space-y-6">
      {data.bestSellers?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /> Top Sellers</h3>
          <div className="table-glass rounded-2xl overflow-hidden">
            <table className="w-full"><thead><tr className="bg-gray-50/80 dark:bg-gray-800/80"><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">#</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Item</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Category</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Sold</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Revenue</th></tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">{data.bestSellers.map((i,idx) => (
              <tr key={i.item_id}><td className="px-5 py-3 text-sm font-bold text-brand-500">{idx+1}</td><td className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white">{i.name}</td><td className="px-5 py-3 text-xs text-gray-500">{i.category}</td><td className="px-5 py-3 text-sm font-bold">{i.units_sold}</td><td className="px-5 py-3 text-sm font-bold text-emerald-600">₱{parseFloat(i.revenue).toFixed(2)}</td></tr>
            ))}</tbody></table>
          </div>
        </div>
      )}
      {data.byCategory?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-pink-500" /> Sales by Category</h3>
          <div className="flex gap-3 flex-wrap">{data.byCategory.map(c => (
            <div key={c.category} className="card-glass rounded-xl px-4 py-3"><p className="text-xs text-gray-400">{c.category}</p><p className="text-sm font-bold text-gray-900 dark:text-white">{c.units_sold} sold · ₱{parseFloat(c.revenue).toFixed(2)}</p></div>
          ))}</div>
        </div>
      )}
      {data.neverOrdered?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Never Ordered ({data.neverOrdered.length})</h3>
          <div className="flex gap-2 flex-wrap">{data.neverOrdered.map(i => (
            <span key={i.item_id} className="px-3 py-1.5 text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800">{i.name}</span>
          ))}</div>
        </div>
      )}
    </div>
  );
}

function CustomerReport({ data, StatCard }) {
  const s = data.summary || {};
  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <StatCard label="Total Customers" value={s.total_customers || 0} icon={Users} color="text-cyan-500" />
        <StatCard label="Active" value={s.active_customers || 0} icon={TrendingUp} color="text-green-500" />
        <StatCard label="Inactive" value={s.inactive_customers || 0} icon={TrendingDown} color="text-red-500" />
      </div>
      {data.topSpenders?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Top Spenders</h3>
          <div className="table-glass rounded-2xl overflow-hidden">
            <table className="w-full"><thead><tr className="bg-gray-50/80 dark:bg-gray-800/80"><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">#</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Customer</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Orders</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Spent</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Balance</th></tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">{data.topSpenders.map((c,i) => (
              <tr key={c.user_id}><td className="px-5 py-3 text-sm font-bold text-brand-500">{i+1}</td><td className="px-5 py-3"><p className="text-sm font-semibold text-gray-900 dark:text-white">{c.full_name}</p><p className="text-xs text-gray-400">{c.email}</p></td><td className="px-5 py-3 text-sm font-semibold">{c.order_count}</td><td className="px-5 py-3 text-sm font-bold text-emerald-600">₱{parseFloat(c.total_spent).toFixed(2)}</td><td className="px-5 py-3 text-sm">₱{parseFloat(c.wallet_balance).toFixed(2)}</td></tr>
            ))}</tbody></table>
          </div>
        </div>
      )}
      {data.recentSignups?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Sign-ups</h3>
          <div className="flex gap-2 flex-wrap">{data.recentSignups.map(u => (
            <div key={u.user_id} className="card-glass rounded-xl px-4 py-2.5"><p className="text-sm font-semibold text-gray-900 dark:text-white">{u.full_name}</p><p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('en-PH',{day:'numeric',month:'short'})}</p></div>
          ))}</div>
        </div>
      )}
    </div>
  );
}

function OrderReport({ data, StatCard }) {
  const f = data.fulfillment || {};
  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <StatCard label="Total" value={f.total || 0} icon={ClipboardList} color="text-orange-500" />
        <StatCard label="Completed" value={f.completed || 0} icon={TrendingUp} color="text-green-500" />
        <StatCard label="Cancelled" value={f.cancelled || 0} icon={TrendingDown} color="text-red-500" />
        <StatCard label="Cancel Rate" value={`${f.cancellation_rate || 0}%`} icon={AlertTriangle} color="text-amber-500" />
      </div>
      {data.byStatus?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Orders by Status</h3>
          <div className="flex gap-3 flex-wrap">{data.byStatus.map(s => (
            <div key={s.status} className="card-glass rounded-xl px-4 py-3"><p className="text-xs text-gray-400">{s.status}</p><p className="text-lg font-bold text-gray-900 dark:text-white">{s.count}</p></div>
          ))}</div>
        </div>
      )}
      {data.peakHours?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> Peak Hours</h3>
          <div className="table-glass rounded-2xl overflow-hidden">
            <table className="w-full"><thead><tr className="bg-gray-50/80 dark:bg-gray-800/80"><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Hour</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Orders</th></tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">{data.peakHours.slice(0,10).map(h => (
              <tr key={h.hour}><td className="px-5 py-3 text-sm font-semibold">{h.hour === 0 ? '12 AM' : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? '12 PM' : `${h.hour-12} PM`}</td><td className="px-5 py-3 text-sm font-bold text-orange-500">{h.orders}</td></tr>
            ))}</tbody></table>
          </div>
        </div>
      )}
    </div>
  );
}

function CashReport({ data, StatCard }) {
  const s = data.summary || {};
  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <StatCard label="Total Collected" value={`₱${parseFloat(s.total_collected || 0).toFixed(2)}`} icon={Wallet} color="text-emerald-500" />
        <StatCard label="Total Top-ups" value={s.total_topups || 0} icon={ArrowRightLeft} color="text-blue-500" />
      </div>
      {data.byAdmin?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Collection by Admin</h3>
          <div className="flex gap-3 flex-wrap">{data.byAdmin.map(a => (
            <div key={a.admin_name} className="card-glass rounded-xl px-4 py-3"><p className="text-xs text-gray-400">{a.admin_name}</p><p className="text-sm font-bold text-gray-900 dark:text-white">₱{parseFloat(a.collected).toFixed(2)} · {a.topups} txns</p></div>
          ))}</div>
        </div>
      )}
      {data.daily?.length > 0 && (
        <div className="table-glass rounded-2xl overflow-hidden">
          <h3 className="px-5 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">Daily Collection</h3>
          <table className="w-full"><thead><tr className="bg-gray-50/80 dark:bg-gray-800/80"><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Date</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Collected</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Top-ups</th></tr></thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">{data.daily.map((d,i) => (
            <tr key={i}><td className="px-5 py-3 text-sm">{new Date(d.date).toLocaleDateString('en-PH',{day:'numeric',month:'short',year:'numeric'})}</td><td className="px-5 py-3 text-sm font-bold text-emerald-600">₱{parseFloat(d.collected).toFixed(2)}</td><td className="px-5 py-3 text-sm">{d.topups}</td></tr>
          ))}</tbody></table>
        </div>
      )}
    </div>
  );
}
