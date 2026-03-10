import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.full_name}`);
      navigate(user.role === 'ADMIN' || user.role === 'STAFF' ? '/admin' : '/menu');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login failed';
      toast.error(msg.startsWith('[') ? 'Invalid email or password' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex auth-bg">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 relative overflow-hidden">
        {/* Animated decorative shapes */}
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full border-2 border-white animate-float" />
          <div className="absolute bottom-32 right-10 w-48 h-48 rounded-full border-2 border-white animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full border-2 border-white animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-40 right-40 w-16 h-16 rounded-full bg-white animate-float" style={{ animationDelay: '0.5s' }} />
        </div>
        {/* Gradient overlay dots */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10 flex flex-col justify-center px-16 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-white/20 glass flex items-center justify-center mb-8 shadow-2xl">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Canteen<br />Management System
          </h1>
          <p className="text-brand-100 text-lg leading-relaxed max-w-md">
            Order meals, manage your wallet, and track your orders — all in one place.
          </p>
          <div className="flex gap-4 mt-10">
            <div className="bg-white/10 glass rounded-xl px-4 py-3">
              <p className="text-2xl font-bold text-white">22+</p>
              <p className="text-xs text-brand-200">Menu Items</p>
            </div>
            <div className="bg-white/10 glass rounded-xl px-4 py-3">
              <p className="text-2xl font-bold text-white">Fast</p>
              <p className="text-xs text-brand-200">Ordering</p>
            </div>
            <div className="bg-white/10 glass rounded-xl px-4 py-3">
              <p className="text-2xl font-bold text-white">Easy</p>
              <p className="text-xs text-brand-200">Payments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-8 py-12 relative">
        {/* Ambient orbs for right panel */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden lg:hidden" aria-hidden="true">
          <div className="ambient-orb w-72 h-72 bg-brand-300 -top-20 -right-20" />
          <div className="ambient-orb w-56 h-56 bg-amber-200 -bottom-16 -left-16" style={{ animationDelay: '-4s' }} />
        </div>
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">Canteen Management</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white dark:bg-gray-800 dark:text-white hover:border-gray-300 dark:hover:border-gray-600 dark:placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white dark:bg-gray-800 dark:text-white hover:border-gray-300 dark:hover:border-gray-600 dark:placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl text-sm font-semibold hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
              Create one
            </Link>
          </p>

          <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">Demo Accounts</p>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <button
                type="button"
                onClick={() => { setEmail('admin@canteen.local'); setPassword('admin123'); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
              >
                <span><span className="font-medium text-gray-700 dark:text-gray-200">Admin:</span> admin@canteen.local</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-500 transition-colors" />
              </button>
              <button
                type="button"
                onClick={() => { setEmail('user1@example.com'); setPassword('user123'); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
              >
                <span><span className="font-medium text-gray-700 dark:text-gray-200">User:</span> user1@example.com</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-500 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
