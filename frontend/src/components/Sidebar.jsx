import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
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
} from 'lucide-react';
import { useState } from 'react';

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
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const navItems = isAdmin ? [...adminNav, ...customerNav] : customerNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-30 transition-all duration-200 ${
        collapsed ? 'w-[68px]' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-100 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-gray-900 text-sm leading-tight">
            Canteen<br />Management
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        {isAdmin && !collapsed && (
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Admin
          </p>
        )}
        {navItems.map((item) => {
          if (item === customerNav[0] && isAdmin && !collapsed) {
            return (
              <div key="divider">
                <div className="border-t border-gray-100 my-3" />
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                  Customer
                </p>
                <SidebarLink item={item} collapsed={collapsed} badge={item.badge ? itemCount : 0} />
              </div>
            );
          }
          return (
            <SidebarLink
              key={item.to}
              item={item}
              collapsed={collapsed}
              badge={item.badge ? itemCount : 0}
            />
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-100 p-3 space-y-2 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors ${
            collapsed ? 'justify-center py-2.5' : 'px-3 py-2.5'
          }`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && 'Log out'}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
        )}
      </button>
    </aside>
  );
}

function SidebarLink({ item, collapsed, badge }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/admin'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg text-sm font-medium transition-colors relative ${
          collapsed ? 'justify-center py-2.5' : 'px-3 py-2.5'
        } ${
          isActive
            ? 'bg-brand-50 text-brand-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`
      }
    >
      <Icon className="w-[18px] h-[18px] shrink-0" />
      {!collapsed && item.label}
      {badge > 0 && (
        <span className={`absolute ${collapsed ? '-top-1 -right-1' : 'right-3'} min-w-[18px] h-[18px] rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center px-1`}>
          {badge}
        </span>
      )}
    </NavLink>
  );
}
