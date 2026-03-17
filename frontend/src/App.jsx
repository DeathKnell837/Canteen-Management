import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Menu from './pages/customer/Menu';
import Cart from './pages/customer/Cart';
import Orders from './pages/customer/Orders';
import Wallet from './pages/customer/Wallet';
import Transactions from './pages/customer/Transactions';
import Dashboard from './pages/admin/Dashboard';
import MenuManagement from './pages/admin/MenuManagement';
import OrderManagement from './pages/admin/OrderManagement';
import Inventory from './pages/admin/Inventory';
import Reports from './pages/admin/Reports';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/menu'} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/menu" /> : <Register />} />

      {/* Customer routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/transactions" element={<Transactions />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/menu" element={<MenuManagement />} />
          <Route path="/admin/orders" element={<OrderManagement />} />
          <Route path="/admin/inventory" element={<Inventory />} />
          <Route path="/admin/reports" element={<Reports />} />
        </Route>
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={user ? (user.role === 'ADMIN' ? '/admin' : '/menu') : '/login'} />} />
    </Routes>
  );
}
