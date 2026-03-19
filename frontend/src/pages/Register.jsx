import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Mail, Lock, Eye, EyeOff, Phone, UserIcon, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    let newErrors = {};

    if (!form.fullName || form.fullName.trim().length < 3) newErrors.fullName = 'Name must be at least 3 characters';
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Please enter a valid email address';
    if (!/^[0-9]{10,11}$/.test(form.phone)) newErrors.phone = 'Phone must be 10-11 digits';
    if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirm) newErrors.confirm = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await register(form.email, form.phone, form.password, form.fullName);
      toast.success('Account created successfully!');
      navigate('/menu');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed';
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white dark:bg-gray-800 dark:text-white hover:border-gray-300 dark:hover:border-gray-600 dark:placeholder-gray-500";

  return (
    <div className="min-h-screen flex auth-bg">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full border-2 border-white animate-float" />
          <div className="absolute bottom-32 right-10 w-48 h-48 rounded-full border-2 border-white animate-float" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10 flex flex-col justify-center px-16 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-white/20 glass flex items-center justify-center mb-8 shadow-2xl">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">Join<br />R&R Cafeteria</h1>
          <p className="text-brand-100 text-lg leading-relaxed max-w-md">
            Create an account to start ordering, track meals, and manage your wallet balance.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-8 py-12 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden lg:hidden" aria-hidden="true">
          <div className="ambient-orb w-72 h-72 bg-brand-300 -top-20 -right-20" />
          <div className="ambient-orb w-56 h-56 bg-amber-200 -bottom-16 -left-16" style={{ animationDelay: '-4s' }} />
        </div>
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">R&R Cafeteria</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Create account</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Fill in your details to get started</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm mb-4">{errors.submit}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
              <div className="relative group">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                <input type="text" value={form.fullName} onChange={set('fullName')} placeholder="Juan Dela Cruz" className={`${inputClass} ${errors.fullName ? 'border-red-500' : ''}`} />
              </div>
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`} />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone (10-11 digits)</label>
              <div className="relative group">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="09171234567" className={`${inputClass} ${errors.phone ? 'border-red-500' : ''}`} />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min 8 characters"
                  className={`w-full pl-11 pr-12 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white dark:bg-gray-800 dark:text-white hover:border-gray-300 dark:hover:border-gray-600 dark:placeholder-gray-500 ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPass ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                <input type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" className={`${inputClass} ${errors.confirm ? 'border-red-500' : ''}`} />
              </div>
              {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl text-sm font-semibold hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
