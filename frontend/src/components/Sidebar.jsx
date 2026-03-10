import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import {
  UtensilsCrossed,
  ShoppingCart,
  ClipboardList,
  Wallet,
  LayoutDashboard,
  BookOpen,
  Package,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const customerNav = [
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: true },
  { to: '/orders', label: 'My Orders', icon: ClipboardList },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
];

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/menu', label: 'Menu Mgmt', icon: BookOpen },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/inventory', label: 'Inventory', icon: Package },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const navItems = isAdmin ? [...adminNav, ...customerNav] : customerNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden w-10 h-10 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-white/50 dark:border-gray-700/50 shadow-lg shadow-black/5 flex items-center justify-center hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all"
      >
        <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-40 lg:hidden animate-overlay-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen sidebar-glass flex flex-col z-50 transition-all duration-300 ease-in-out
          ${collapsed ? 'lg:w-[72px]' : 'lg:w-64'}
          ${mobileOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/40 dark:border-gray-700/40 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-gray-900 dark:text-white text-sm leading-tight animate-fade-in">
              Canteen<br />Management
            </span>
          )}
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-hide">
          {isAdmin && !collapsed && (
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2 animate-fade-in">
              Admin
            </p>
          )}
          {navItems.map((item, idx) => {
            if (item === customerNav[0] && isAdmin && !collapsed) {
              return (
                <div key="divider">
                  <div className="border-t border-gray-100 dark:border-gray-700 my-3" />
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2 animate-fade-in">
                    Customer
                  </p>
                  <SidebarLink item={item} collapsed={collapsed} badge={item.badge ? itemCount : 0} onClick={() => setMobileOpen(false)} />
                </div>
              );
            }
            return (
              <SidebarLink
                key={item.to}
                item={item}
                collapsed={collapsed}
                badge={item.badge ? itemCount : 0}
                onClick={() => setMobileOpen(false)}
              />
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-white/40 dark:border-gray-700/40 p-3 space-y-2 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2 animate-fade-in">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-800 dark:to-brand-900 flex items-center justify-center ring-2 ring-brand-100 dark:ring-brand-800">
                <User className="w-4 h-4 text-brand-600 dark:text-brand-300" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
          )}
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className={`flex items-center gap-3 w-full rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 ${
              collapsed ? 'justify-center py-2.5' : 'px-3 py-2.5'
            }`}
          >
            {dark ? <Sun className="w-[18px] h-[18px] shrink-0" /> : <Moon className="w-[18px] h-[18px] shrink-0" />}
            {!collapsed && (dark ? 'Light mode' : 'Dark mode')}
          </button>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all duration-200 ${
              collapsed ? 'justify-center py-2.5' : 'px-3 py-2.5'
            }`}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && 'Log out'}
          </button>
        </div>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3.5 top-20 w-7 h-7 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 items-center justify-center shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-lg transition-all duration-200"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          )}
        </button>
      </aside>
    </>
  );
}

function SidebarLink({ item, collapsed, badge, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/admin'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
          collapsed ? 'justify-center py-2.5' : 'px-3 py-2.5'
        } ${
          isActive
            ? 'bg-gradient-to-r from-brand-50 to-brand-100/50 dark:from-brand-900/30 dark:to-brand-800/20 text-brand-700 dark:text-brand-400 shadow-sm shadow-brand-100 dark:shadow-brand-900/20'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand-500 rounded-r-full" />
          )}
          <Icon className={`w-[18px] h-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-brand-600' : ''}`} />
          {!collapsed && <span>{item.label}</span>}
          {badge > 0 && (
            <span className={`absolute ${collapsed ? '-top-1 -right-1' : 'right-3'} min-w-[20px] h-[20px] rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm shadow-brand-500/30 animate-scale-in`}>
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}
