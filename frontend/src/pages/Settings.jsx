import { useEffect, useState, useRef } from 'react';
import { Moon, Sun, Shield, KeyRound, Mail, User, Camera, UserPlus, Users, Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Settings() {
  const { dark, toggle } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isCustomer = user?.role === 'CUSTOMER';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/settings/profile');
        setProfile(res.data.data);
      } catch {
        // fallback to user from context
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    ...(isAdmin ? [{ id: 'admins', label: 'Admin Management', icon: Users }] : []),
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your account, security, and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-600 dark:text-gray-300 border border-white/50 dark:border-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'profile' && <ProfileTab profile={profile} setProfile={setProfile} loading={loading} dark={dark} toggle={toggle} />}
      {activeTab === 'security' && <SecurityTab isCustomer={isCustomer} />}
      {activeTab === 'admins' && isAdmin && <AdminManagementTab />}
    </div>
  );
}

function ProfileTab({ profile, setProfile, loading, dark, toggle }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrors(prev => ({ ...prev, profile: null, fullName: null, phone: null }));
    let newErrors = {};
    if (!fullName.trim() || fullName.trim().length < 2) newErrors.fullName = 'Name must be at least 2 characters';
    if (phone && !/^[0-9]{10,11}$/.test(phone)) newErrors.phone = 'Phone must be 10-11 digits';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/settings/profile', { fullName: fullName.trim(), phone: phone.trim() });
      toast.success('Profile updated');
      setProfile(p => ({ ...p, full_name: res.data.data.full_name, phone: res.data.data.phone }));
    } catch (err) {
      setErrors(prev => ({ ...prev, profile: err.response?.data?.error?.message || 'Update failed' }));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    setErrors(prev => ({ ...prev, emailSubmit: null, newEmail: null, emailPassword: null }));
    let newErrors = {};
    if (!newEmail) newErrors.newEmail = 'New email is required';
    else if (!/\S+@\S+\.\S+/.test(newEmail)) newErrors.newEmail = 'Valid email is required';
    if (!emailPassword) newErrors.emailPassword = 'Password confirmation is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }
    setSavingEmail(true);
    try {
      await api.put('/settings/email', { newEmail, password: emailPassword });
      toast.success('Email updated');
      setProfile(p => ({ ...p, email: newEmail }));
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      setErrors(prev => ({ ...prev, emailSubmit: err.response?.data?.error?.message || 'Update failed' }));
    } finally {
      setSavingEmail(false);
    }
  };

  const handleUploadPicture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('picture', file);
      const res = await api.post('/settings/profile/picture', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Profile picture updated');
      setProfile(p => ({ ...p, profile_picture_url: res.data.data.profile_picture_url }));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white';

  if (loading) return <div className="skeleton h-60 rounded-2xl" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Profile Info */}
      <div className="card-glass rounded-2xl p-5">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-500" />
          Profile Information
        </h2>

        {/* Profile Picture */}
        <div className="flex items-center gap-4 mb-5">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUploadPicture} />
          <div
            onClick={() => fileRef.current?.click()}
            className="relative w-16 h-16 rounded-full cursor-pointer group overflow-hidden flex-shrink-0"
          >
            {profile?.profile_picture_url ? (
              <img src={profile.profile_picture_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-800 dark:to-brand-900 flex items-center justify-center">
                <User className="w-6 h-6 text-brand-600 dark:text-brand-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile?.full_name}</p>
            <p className="text-xs text-gray-400">{profile?.email}</p>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs text-brand-500 hover:text-brand-600 mt-1 font-medium"
            >
              {uploading ? 'Uploading...' : 'Change photo'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          {errors.profile && <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm mb-3">{errors.profile}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input value={fullName} onChange={(e) => { setFullName(e.target.value); if(errors.fullName) setErrors(p => ({...p, fullName: null})); }} className={`${inputClass} ${errors.fullName ? 'border-red-500' : ''}`} placeholder="Your Name" />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input value={phone} onChange={(e) => { setPhone(e.target.value); if(errors.phone) setErrors(p => ({...p, phone: null})); }} className={`${inputClass} ${errors.phone ? 'border-red-500' : ''}`} placeholder="09xxxxxxxxx" />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 mt-2"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        {/* Email Change */}
        <form onSubmit={handleSaveEmail} className="card-glass rounded-2xl p-5">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-500" />
            Change Email
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Current: <strong>{profile?.email}</strong></p>
          
          {errors.emailSubmit && <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm mb-3">{errors.emailSubmit}</div>}
          
          <div className="space-y-3">
            <div>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); if(errors.newEmail) setErrors(p => ({...p, newEmail: null})); }}
                placeholder="New email address"
                className={`${inputClass} ${errors.newEmail ? 'border-red-500' : ''}`}
              />
              {errors.newEmail && <p className="mt-1 px-1 text-xs text-red-500">{errors.newEmail}</p>}
            </div>
            <div>
              <input
                type="password"
                value={emailPassword}
                onChange={(e) => { setEmailPassword(e.target.value); if(errors.emailPassword) setErrors(p => ({...p, emailPassword: null})); }}
                placeholder="Password confirmation to change email"
                className={`${inputClass} ${errors.emailPassword ? 'border-red-500' : ''}`}
              />
              {errors.emailPassword && <p className="mt-1 px-1 text-xs text-red-500">{errors.emailPassword}</p>}
            </div>
          </div>
          <button
            type="submit"
            disabled={savingEmail}
            className="mt-4 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
          >
            {savingEmail ? 'Updating...' : 'Update Email'}
          </button>
        </form>

        {/* Appearance */}
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
      </div>
    </div>
  );
}

function SecurityTab({ isCustomer }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Wallet PIN (customers only)
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => {
    if (!isCustomer) return;
    const load = async () => {
      try {
        const res = await api.get('/payments/wallet/pin/status');
        setHasPin(!!res.data?.data?.hasPin);
      } catch { /* ignore */ }
    };
    load();
  }, [isCustomer]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await api.put('/settings/password', { currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

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
    if (!accountPassword || accountPassword.length < 8) {
      toast.error('Enter your account password');
      return;
    }
    setSavingPin(true);
    try {
      await api.post('/payments/wallet/pin', { pin, accountPassword });
      toast.success(hasPin ? 'Wallet PIN updated' : 'Wallet PIN set');
      setHasPin(true);
      setPin('');
      setConfirmPin('');
      setAccountPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed');
    } finally {
      setSavingPin(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="card-glass rounded-2xl p-5">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-brand-500" />
          Change Password
        </h2>
        <div className="space-y-3">
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className={inputClass}
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              className={inputClass}
            />
            <button type="button" onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? 'Changing...' : 'Change Password'}
        </button>
      </form>

      {/* Wallet PIN (customer only) */}
      {isCustomer && (
        <form onSubmit={handleSavePin} className="card-glass rounded-2xl p-5">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand-500" />
            Wallet PIN
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {hasPin ? 'Your wallet PIN is set. Update it below.' : 'Set your wallet PIN to secure payments.'}
          </p>
          <div className="space-y-3">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="New PIN (4 to 6 digits)"
              maxLength={6}
              className={inputClass}
            />
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Confirm PIN"
              maxLength={6}
              className={inputClass}
            />
            <input
              type="password"
              value={accountPassword}
              onChange={(e) => setAccountPassword(e.target.value)}
              placeholder="Account password confirmation"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={savingPin}
            className="mt-4 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
          >
            {savingPin ? 'Saving...' : hasPin ? 'Update PIN' : 'Set PIN'}
          </button>
        </form>
      )}
    </div>
  );
}

function AdminManagementTab() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', password: '', role: 'ADMIN' });
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState({});

  const loadAdmins = async () => {
    try {
      const res = await api.get('/settings/admins');
      setAdmins(res.data.data || []);
    } catch {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrors({});
    let newErrors = {};
    if (!form.fullName || form.fullName.trim().length < 3) newErrors.fullName = 'Name must be at least 3 characters';
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Valid email is required';
    if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setCreating(true);
    try {
      await api.post('/settings/admins', form);
      toast.success('Admin account created');
      setForm({ email: '', fullName: '', password: '', role: 'ADMIN' });
      setShowCreate(false);
      loadAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (userId) => {
    try {
      const res = await api.put(`/settings/admins/${userId}/toggle`);
      toast.success(res.data.message);
      loadAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed');
    }
  };

  const inputClass = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-500" />
          Admin Accounts
        </h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/20"
        >
          <UserPlus className="w-4 h-4" /> New Admin
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="card-glass rounded-2xl p-5 animate-fade-in-up">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Create New Admin Account</h3>
          {errors.submit && <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm mb-4">{errors.submit}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input value={form.fullName} onChange={(e) => { setForm({ ...form, fullName: e.target.value }); if(errors.fullName) setErrors({...errors, fullName: null}); }} className={`${inputClass} ${errors.fullName ? 'border-red-500' : ''}`} placeholder="John Doe" />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); if(errors.email) setErrors({...errors, email: null}); }} className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`} placeholder="admin@canteen.local" />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); if(errors.password) setErrors({...errors, password: null}); }} className={`${inputClass} ${errors.password ? 'border-red-500' : ''}`} placeholder="Min 8 characters" />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={`${inputClass} bg-white dark:bg-gray-800`}>
                <option value="ADMIN">Admin</option>
                <option value="STAFF">Staff</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={creating}
              className="px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 inline-flex items-center gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {creating ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      )}

      {/* Admin List */}
      <div className="table-glass rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-800/80">
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">User</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Role</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Status</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Joined</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center"><Loader2 className="w-5 h-5 text-gray-400 animate-spin mx-auto" /></td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">No admin accounts</td></tr>
              ) : admins.map((a) => (
                <tr key={a.user_id} className="hover:bg-brand-50/30 dark:hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{a.full_name}</p>
                    <p className="text-xs text-gray-400">{a.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-100 text-brand-700 border border-brand-200 capitalize">
                      {a.role.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      a.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {a.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(a.created_at).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleToggle(a.user_id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        a.status === 'ACTIVE'
                          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                          : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                    >
                      {a.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
