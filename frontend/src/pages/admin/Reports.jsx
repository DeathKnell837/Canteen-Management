import { useState, useEffect, useRef } from 'react';
import { BarChart3, Package, ArrowRightLeft, UtensilsCrossed, Users, ClipboardList, Wallet, CalendarDays, Printer, Download, Loader2, TrendingUp, TrendingDown, AlertTriangle, Clock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderRows(headers, rows) {
  const head = `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
  const body = rows.length
    ? rows.map((row) => `<tr>${row.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${headers.length}">No data available</td></tr>`;
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function renderPrintSection(tabId, data) {
  if (!data) return '';

  if (tabId === 'sales') {
    const s = data.summary || {};
    return `
      <section>
        <h2>Sales Analytics</h2>
        <div class="stat-container">
          <div class="stat-box"><span>Total Orders</span><strong>${escapeHtml(s.total_orders || 0)}</strong></div>
          <div class="stat-box"><span>Gross Revenue</span><strong>PHP ${escapeHtml(parseFloat(s.total_revenue || 0).toFixed(2))}</strong></div>
        </div>
        ${renderRows(['Date', 'Total Orders', 'Revenue (PHP)'], (data.daily || []).map((d) => [d.date, d.orders, parseFloat(d.revenue || 0).toFixed(2)]))}
      </section>`;
  }

  if (tabId === 'inventory') {
    return `
      <section>
        <h2>Inventory Status</h2>
        <div class="stat-container">
          <div class="stat-box"><span>Distinct Items</span><strong>${escapeHtml(data.total_items || 0)}</strong></div>
          <div class="stat-box"><span>Low Stock Alerts</span><strong style="color:red">${escapeHtml(data.low_stock_count || 0)}</strong></div>
        </div>
        ${renderRows(['Item Name', 'Category', 'Current Stock', 'Reorder Lvl', 'Health'], (data.items || []).map((i) => [i.name, i.category, i.quantity_available, i.reorder_level, i.is_low_stock ? 'CRITICAL' : 'OK']))}
      </section>`;
  }

  if (tabId === 'transactions') {
    return `
      <section>
        <h2>Recent Transactions Log</h2>
        ${renderRows(['Timestamp', 'Customer', 'Type', 'Amount (PHP)'], (data.transactions || []).slice(0, 100).map((t) => [new Date(t.created_at).toLocaleString('en-US'), t.customer_name, t.transaction_type, parseFloat(t.amount || 0).toFixed(2)]))}
      </section>`;
  }

  if (tabId === 'menu') {
    return `
      <section>
        <h2>Menu Performance Matrix</h2>
        ${renderRows(['Item Name', 'Category', 'Units Sold', 'Revenue Generated'], (data.bestSellers || []).map((i) => [i.name, i.category, i.units_sold, 'PHP ' + parseFloat(i.revenue || 0).toFixed(2)]))}
      </section>`;
  }

  if (tabId === 'customers') {
    return `
      <section>
        <h2>Top Customer Spenders</h2>
        ${renderRows(['Full Name', 'Email Address', 'Lifetime Orders', 'Lifetime Spend'], (data.topSpenders || []).map((c) => [c.full_name, c.email, c.order_count, 'PHP ' + parseFloat(c.total_spent || 0).toFixed(2)]))}
      </section>`;
  }

  if (tabId === 'orders') {
    const f = data.fulfillment || {};
    return `
      <section>
        <h2>Order Fulfillment Analytics</h2>
        <div class="stat-container">
          <div class="stat-box"><span>Total Orders Processed</span><strong>${escapeHtml(f.total || 0)}</strong></div>
          <div class="stat-box"><span>Cancelled Orders</span><strong>${escapeHtml(f.cancelled || 0)}</strong></div>
          <div class="stat-box"><span>Cancellation Rate</span><strong>${escapeHtml(f.cancellation_rate || 0)}%</strong></div>
        </div>
        ${renderRows(['Order State', 'Current Volume'], (data.byStatus || []).map((s) => [s.status, s.count]))}
      </section>`;
  }

  if (tabId === 'cash') {
    const s = data.summary || {};
    return `
      <section>
        <h2>Wallet Cash Collection</h2>
        <div class="stat-container">
          <div class="stat-box"><span>Gross Cash Collected</span><strong>PHP ${escapeHtml(parseFloat(s.total_collected || 0).toFixed(2))}</strong></div>
          <div class="stat-box"><span>Total Top-up Count</span><strong>${escapeHtml(s.total_topups || 0)}</strong></div>
        </div>
        ${renderRows(['Date', 'Cash Collected (PHP)', 'Top-up Count'], (data.daily || []).map((d) => [d.date, parseFloat(d.collected || 0).toFixed(2), d.topups]))}
      </section>`;
  }

  return '';
}

export default function Reports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sales');
  const [period, setPeriod] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printingAll, setPrintingAll] = useState(false);
  const [showPrintPicker, setShowPrintPicker] = useState(false);
  const [printOrder, setPrintOrder] = useState([]);
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

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    const range = getDateRange(period);
    if (range.startDate) params.append('startDate', range.startDate);
    if (range.endDate) params.append('endDate', range.endDate);
    return params.toString();
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`${endpoints[activeTab]}?${buildQueryParams()}`);
        setData(res.data.data);
      } catch { toast.error('Failed to load report'); }
      finally { setLoading(false); }
    };
    load();
  }, [activeTab, period]);

  const printStyles = `
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; padding: 0; margin: 0; }
    .header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header-titles h1 { margin: 0; font-size: 26px; color: #1e3a8a; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .header-titles p { margin: 4px 0 0; font-size: 13px; color: #64748b; font-weight: 500; }
    .meta-box { text-align: right; }
    .meta-box p { margin: 2px 0; font-size: 11px; color: #475569; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
    th { background-color: #f8fafc; color: #334155; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    tr:nth-child(even) { background-color: #fcfcfc; }
    h2 { font-size: 16px; color: #1e293b; margin: 30px 0 15px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; }
    .stat-container { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
    .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 18px; border-radius: 6px; min-width: 160px; }
    .stat-box span { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; font-weight: 600; }
    .stat-box strong { font-size: 18px; color: #0f172a; }
    .footer { margin-top: 60px; padding-top: 30px; display: flex; justify-content: space-between; page-break-inside: avoid; }
    .sig-box { width: 220px; text-align: center; }
    .sig-line { border-bottom: 1px solid #334155; height: 50px; margin-bottom: 10px; }
    .sig-name { font-size: 13px; font-weight: 600; color: #1e293b; text-transform: uppercase; }
    .sig-title { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .sig-value { font-family: 'Georgia', serif; font-size: 17px; font-style: italic; color: #1e293b; height: 26px; display: flex; align-items: flex-end; justify-content: center; }
    .dashboard-graphics { margin: 20px 0; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; font-size: 11px; color: #94a3b8; text-align: center; background: #f8fafc; }
  `;

  const getHeaderHTML = (title) => `
    <div class="header">
      <div class="header-titles">
        <h1>R&R Cafeteria</h1>
        <p>Official ${title}</p>
      </div>
      <div class="meta-box">
        <p><strong>Period:</strong> ${escapeHtml(PERIODS.find((p) => p.val === period)?.label || 'All Time')}</p>
        <p><strong>Generated:</strong> ${escapeHtml(new Date().toLocaleString('en-US'))}</p>
        <p><strong>Document ID:</strong> RPT-${Math.floor(Math.random() * 100000)}</p>
      </div>
    </div>
  `;



  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Please allow pop-ups to print');
      return;
    }
    
    const sectionHTML = renderPrintSection(activeTab, data);

    win.document.write(`<html><head><title>Report - ${TABS.find(t=>t.id===activeTab)?.label}</title>
      <style>${printStyles}</style></head><body>
      ${getHeaderHTML(TABS.find(t=>t.id===activeTab)?.label + ' Report')}
      ${sectionHTML}
      </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 250); // slight delay for paint
  };

  const handlePrintSelected = async () => {
    const selectedTabs = printOrder
      .map((id) => TABS.find((t) => t.id === id))
      .filter(Boolean);

    if (selectedTabs.length === 0) {
      toast.error('Select at least one report category to print');
      return;
    }

    setPrintingAll(true);
    try {
      const query = buildQueryParams();
      const results = await Promise.all(
        selectedTabs.map(async (tab) => {
          const res = await api.get(`${endpoints[tab.id]}?${query}`);
          return { id: tab.id, label: tab.label, data: res.data.data };
        })
      );

      const sections = results.map((r) => renderPrintSection(r.id, r.data)).join('');
      const win = window.open('', '_blank');
      if (!win) {
        toast.error('Please allow pop-ups to print');
        return;
      }

      win.document.write(`<html><head><title>Comprehensive Reports</title>
        <style>${printStyles}</style></head><body>
        ${getHeaderHTML('Comprehensive Consolidated Report')}
        ${sections}
      </body></html>`);
      win.document.close();
      setTimeout(() => { win.print(); }, 250);

      setShowPrintPicker(false);
    } catch {
      toast.error('Failed to prepare all categories for printing');
    } finally {
      setPrintingAll(false);
    }
  };

  const togglePrintSection = (tabId) => {
    setPrintOrder((prev) => {
      if (prev.includes(tabId)) {
        return prev.filter((id) => id !== tabId);
      }
      return [...prev, tabId];
    });
  };

  const handlePrintSelectedClick = () => {
    if (!showPrintPicker) {
      setShowPrintPicker(true);
      return;
    }
    handlePrintSelected();
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
          <button onClick={handlePrintSelectedClick} disabled={printingAll} className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-xs font-semibold text-gray-600 dark:text-gray-300 disabled:opacity-50" title="Print selected categories">
            {printingAll ? 'Printing...' : showPrintPicker ? 'Print Now' : 'Print Selected'}
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

      {/* Print selector (hidden until Print Selected is pressed) */}
      {showPrintPicker && (
        <div className="mb-4 card-glass rounded-xl p-3 animate-fade-in-up" style={{ animationDelay: '0.04s', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Print Categories (order follows your check sequence)</p>
            <button
              type="button"
              onClick={() => {
                setShowPrintPicker(false);
                setPrintOrder([]);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Close
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {TABS.map((tab) => {
              const position = printOrder.indexOf(tab.id);
              const checked = position !== -1;
              return (
                <label key={`print-${tab.id}`} className="inline-flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePrintSection(tab.id)}
                  />
                  {tab.label}
                  {checked && <span className="text-[10px] font-bold text-brand-500">#{position + 1}</span>}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Report tabs */}
      <div className="flex gap-2 mb-6 flex-wrap animate-fade-in-up" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card-glass rounded-2xl p-5 border border-emerald-100/50 dark:border-emerald-900/20">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Revenue Trend</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.daily} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US',{month:'short',day:'numeric'})} stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₱${v}`} dx={-5} />
                  <RechartsTooltip contentStyle={{borderRadius:'12px',border:'none',backgroundColor:'#111827',color:'#fff'}} itemStyle={{color:'#10b981'}} formatter={(v) => [`₱${parseFloat(v).toFixed(2)}`, 'Revenue']} labelFormatter={(l) => new Date(l).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="table-glass rounded-2xl overflow-hidden h-fit">
            <h3 className="px-5 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">Daily Breakdown</h3>
            <div className="max-h-[270px] overflow-y-auto scrollbar-hide">
              <table className="w-full"><thead><tr className="bg-gray-50/80 dark:bg-gray-800/80 sticky top-0 z-10"><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Date</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Orders</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Revenue</th></tr></thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-gray-900 dark:text-gray-100">{data.daily.map((d,i) => (
                <tr key={i} className="hover:bg-blue-50/30 dark:hover:bg-white/5"><td className="px-5 py-3 text-sm">{new Date(d.date).toLocaleDateString('en-PH',{day:'numeric',month:'short',year:'numeric'})}</td><td className="px-5 py-3 text-sm font-semibold">{d.orders}</td><td className="px-5 py-3 text-sm font-bold text-emerald-600">₱{parseFloat(d.revenue).toFixed(2)}</td></tr>
              ))}</tbody></table>
            </div>
          </div>
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
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-gray-900 dark:text-gray-100">{(data.items||[]).map(i => (
          <tr key={i.item_id} className="hover:bg-amber-50/30 dark:hover:bg-white/5"><td className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white">{i.name}</td><td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{i.category}</td><td className="px-5 py-3 text-sm font-bold text-gray-900 dark:text-gray-100">{i.quantity_available}</td><td className="px-5 py-3 text-sm text-gray-400 dark:text-gray-300">{i.reorder_level}</td>
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
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-gray-900 dark:text-gray-100">{(data.transactions||[]).slice(0,50).map(t => (
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card-glass rounded-2xl p-5 border border-brand-100/50 dark:border-brand-900/20">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-500" /> Units Sold (Top 5)</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.bestSellers.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} horizontal={false} />
                  <XAxis type="number" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={85} tick={{ fill: '#6b7280' }} />
                  <RechartsTooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#111827', color: '#fff' }} itemStyle={{color:'#3b82f6'}} />
                  <Bar dataKey="units_sold" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} name="Units Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="table-glass rounded-2xl overflow-hidden h-fit">
            <h3 className="px-5 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 flex items-center gap-2"><UtensilsCrossed className="w-4 h-4 text-brand-500" /> Top Sellers Table</h3>
            <div className="max-h-[270px] overflow-y-auto scrollbar-hide">
              <table className="w-full"><thead><tr className="bg-gray-50/80 dark:bg-gray-800/80 sticky top-0 z-10"><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">#</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Item</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Category</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Sold</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Revenue</th></tr></thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-gray-900 dark:text-gray-100">{data.bestSellers.map((i,idx) => (
                <tr key={i.item_id}><td className="px-5 py-3 text-sm font-bold text-brand-500">{idx+1}</td><td className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white">{i.name}</td><td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{i.category}</td><td className="px-5 py-3 text-sm font-bold text-gray-900 dark:text-gray-100">{i.units_sold}</td><td className="px-5 py-3 text-sm font-bold text-emerald-600">₱{parseFloat(i.revenue).toFixed(2)}</td></tr>
              ))}</tbody></table>
            </div>
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
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-gray-900 dark:text-gray-100">{data.topSpenders.map((c,i) => (
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
  const pieData = data.byStatus?.map(s => ({ name: s.status, value: parseInt(s.count) })) || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <StatCard label="Total" value={f.total || 0} icon={ClipboardList} color="text-orange-500" />
        <StatCard label="Completed" value={f.completed || 0} icon={TrendingUp} color="text-green-500" />
        <StatCard label="Cancelled" value={f.cancelled || 0} icon={TrendingDown} color="text-red-500" />
        <StatCard label="Cancel Rate" value={`${f.cancellation_rate || 0}%`} icon={AlertTriangle} color="text-amber-500" />
      </div>
      {data.byStatus?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card-glass rounded-2xl p-5 border border-orange-100/50 dark:border-orange-900/20 flex flex-col items-center justify-center">
            <h3 className="font-semibold text-gray-900 dark:text-white w-full text-left mb-2">Order Status</h3>
            <div className="h-[220px] w-full max-w-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#111827', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 flex-wrap justify-center mt-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4 flex flex-col h-full">
            {data.peakHours?.length > 0 && (
              <div className="table-glass rounded-2xl overflow-hidden flex-1 h-full">
                <h3 className="px-5 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> Peak Hours</h3>
                <div className="max-h-[250px] overflow-y-auto scrollbar-hide">
                  <table className="w-full"><thead><tr className="bg-gray-50/80 dark:bg-gray-800/80 sticky top-0 z-10"><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Hour</th><th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left">Orders</th></tr></thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-gray-900 dark:text-gray-100">{data.peakHours.slice(0,6).map(h => (
                    <tr key={h.hour} className="hover:bg-orange-50/30 dark:hover:bg-white/5"><td className="px-5 py-3 text-sm font-semibold">{h.hour === 0 ? '12 AM' : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? '12 PM' : `${h.hour-12} PM`}</td><td className="px-5 py-3 text-sm font-bold text-orange-500">{h.orders}</td></tr>
                  ))}</tbody></table>
                </div>
              </div>
            )}
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
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-gray-900 dark:text-gray-100">{data.daily.map((d,i) => (
            <tr key={i}><td className="px-5 py-3 text-sm">{new Date(d.date).toLocaleDateString('en-PH',{day:'numeric',month:'short',year:'numeric'})}</td><td className="px-5 py-3 text-sm font-bold text-emerald-600">₱{parseFloat(d.collected).toFixed(2)}</td><td className="px-5 py-3 text-sm">{d.topups}</td></tr>
          ))}</tbody></table>
        </div>
      )}
    </div>
  );
}
