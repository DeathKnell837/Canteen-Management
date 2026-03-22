import { useEffect, useState, useRef } from 'react';
import { Shield, KeyRound, Mail, User, Camera, UserPlus, Users, Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, refreshUser, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

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

      {activeTab === 'profile' && <ProfileTab profile={profile} setProfile={setProfile} loading={loading} refreshUser={refreshUser} />}
      {activeTab === 'security' && <SecurityTab />}
      {activeTab === 'admins' && isAdmin && <AdminManagementTab />}
    </div>
  );
}

function ProfileTab({ profile, setProfile, loading, refreshUser }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
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
      if (refreshUser) await refreshUser(); // Update AuthContext so Sidebar syncs
    } catch (err) {
      setErrors(prev => ({ ...prev, profile: err.response?.data?.error?.message || 'Update failed' }));
    } finally {
      setSaving(false);
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
      if (refreshUser) await refreshUser(); // Update AuthContext so Sidebar syncs
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white';

  if (loading) return <div className="skeleton h-60 rounded-2xl" />;

  return (
    <div className="max-w-2xl">
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
    </div>
  );
}

function SecurityTab() {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Wallet PIN state
  const [hasPin, setHasPin] = useState(null);
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinPassword, setPinPassword] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [disablingPin, setDisablingPin] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisablePrompt, setShowDisablePrompt] = useState(false);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const checkPin = async () => {
      try {
        const res = await api.get('/payments/wallet/pin/status');
        setHasPin(res.data.data.hasPin);
      } catch {
        setHasPin(false);
      }
    };
    checkPin();
  }, []);

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

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    if (!newEmail || !emailPassword) {
      toast.error('Email and password are required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      toast.error('Please enter a valid email');
      return;
    }

    setSavingEmail(true);
    try {
      await api.put('/settings/email', { newEmail, password: emailPassword });
      toast.success('Email updated successfully');
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update email');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.prompt('Type "DELETE" to permanently delete your account:') !== 'DELETE') return;

    try {
      await api.delete('/settings/account');
      toast.success('Account deleted successfully');
      if (logout) logout();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete account');
    }
  };

  const handleSetPin = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{4,6}$/.test(pinValue)) {
      toast.error('PIN must be 4 to 6 digits');
      return;
    }
    if (pinValue !== pinConfirm) {
      toast.error('PINs do not match');
      return;
    }
    if (!pinPassword || pinPassword.length < 8) {
      toast.error('Account password is required');
      return;
    }
    setSavingPin(true);
    try {
      await api.post('/payments/wallet/pin', { pin: pinValue, accountPassword: pinPassword });
      toast.success(hasPin ? 'Wallet PIN changed successfully' : 'Wallet PIN set successfully');
      setHasPin(true);
      setPinValue('');
      setPinConfirm('');
      setPinPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to set PIN');
    } finally {
      setSavingPin(false);
    }
  };

  const handleDisablePin = async () => {
    if (!disablePassword) {
      toast.error('Account password is required to disable PIN');
      return;
    }
    setDisablingPin(true);
    try {
      await api.delete('/payments/wallet/pin', { data: { accountPassword: disablePassword } });
      toast.success('Wallet PIN disabled');
      setHasPin(false);
      setDisablePassword('');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to disable PIN');
    } finally {
      setDisablingPin(false);
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

      <div className="space-y-6">
        <form onSubmit={handleSaveEmail} className="card-glass rounded-2xl p-5">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-500" />
            Change Email
          </h2>
          <div className="space-y-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="New email address"
              className={inputClass}
            />
            <input
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              placeholder="Current password"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={savingEmail}
            className="mt-4 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
          >
            {savingEmail ? 'Updating...' : 'Update Email'}
          </button>
        </form>

        {/* Wallet PIN — only for customers */}
        {!isAdmin && (
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-500" />
                Wallet PIN
              </h2>
              {hasPin !== null && (
                <button
                  type="button"
                  onClick={() => {
                    if (hasPin) {
                      setShowDisablePrompt(!showDisablePrompt);
                      setDisablePassword('');
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0 ${
                    hasPin ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  title={hasPin ? 'Click to disable' : 'Set a PIN below to enable'}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                    hasPin ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {hasPin === null
                ? 'Checking...'
                : hasPin
                  ? 'PIN is enabled. You\'ll be asked for it when paying online.'
                  : 'Enable by setting a 4-6 digit PIN. This adds security to online payments.'}
            </p>

            {/* If PIN is ON — show change form + disable option */}
            {hasPin && (
              <div className="space-y-4">
                <form onSubmit={handleSetPin} className="space-y-3">
                  <input type="password" inputMode="numeric" maxLength={6} value={pinValue}
                    onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="New PIN (4-6 digits)" className={inputClass} />
                  <input type="password" inputMode="numeric" maxLength={6} value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Confirm PIN" className={inputClass} />
                  <input type="password" value={pinPassword}
                    onChange={(e) => setPinPassword(e.target.value)}
                    placeholder="Account password" className={inputClass} />
                  <button type="submit" disabled={savingPin}
                    className="px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50">
                    {savingPin ? 'Saving...' : 'Change PIN'}
                  </button>
                </form>
                {showDisablePrompt && (
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Enter your account password to disable wallet PIN:</p>
                    <div className="flex gap-2">
                      <input type="password" value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleDisablePin()}
                        placeholder="Account password" className={`${inputClass} flex-1`} />
                      <button onClick={handleDisablePin} disabled={disablingPin}
                        className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50 whitespace-nowrap">
                        {disablingPin ? 'Disabling...' : 'Disable PIN'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If PIN is OFF — show set form */}
            {hasPin === false && (
              <form onSubmit={handleSetPin} className="space-y-3">
                <input type="password" inputMode="numeric" maxLength={6} value={pinValue}
                  onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Set PIN (4-6 digits)" className={inputClass} />
                <input type="password" inputMode="numeric" maxLength={6} value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Confirm PIN" className={inputClass} />
                <input type="password" value={pinPassword}
                  onChange={(e) => setPinPassword(e.target.value)}
                  placeholder="Account password" className={inputClass} />
                <button type="submit" disabled={savingPin}
                  className="px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50">
                  {savingPin ? 'Saving...' : 'Set PIN'}
                </button>
              </form>
            )}
          </div>
        )}

        {!isAdmin && (
          <div className="card-glass rounded-2xl p-5 border border-red-100 dark:border-red-900/30">
            <h2 className="font-bold text-red-600 dark:text-red-400 text-lg mb-2">Danger Zone</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="w-full px-4 py-2.5 rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
            >
              Delete Account
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

function AdminManagementTab() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState({});

  const isOriginalAdmin = admins.find(a => a.user_id === user?.user_id)?.is_original;

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
      setForm({ email: '', fullName: '', password: '' });
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
        {isOriginalAdmin && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/20"
          >
            <UserPlus className="w-4 h-4" /> New Admin
          </button>
        )}
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
                    {a.is_original && (
                      <span className="ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        OWNER
                      </span>
                    )}
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
                    {!a.is_original && isOriginalAdmin && (
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
                    )}
                    {a.is_original && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 italic">Protected</span>
                    )}
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
