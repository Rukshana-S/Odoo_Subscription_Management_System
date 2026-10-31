import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { authService } from '../services/api';
import { Settings as SettingsIcon, User, Shield, Key, Bell, Database, Check, AlertCircle, Lock } from 'lucide-react';

export const Settings = () => {
  const { user, setUser } = useData();

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '+91 98400 11223'
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Change Password Form State
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // 1. Profile Update Handlers connected to PUT /api/auth/profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setProfileLoading(true);

    try {
      const res = await authService.updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone
      });

      if (res?.success) {
        setUser({ ...user, ...res.user });
        localStorage.setItem('brightloop_auth_user', JSON.stringify({ ...user, ...res.user }));
        setProfileSuccess('Profile updated successfully in BrightLoop.');
        setTimeout(() => setProfileSuccess(''), 4000);
      } else {
        setProfileError(res?.message || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Error communicating with backend API.');
    } finally {
      setProfileLoading(false);
    }
  };

  // 2. Change Password Handlers connected to PATCH /api/auth/change-password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdSuccess('');
    setPwdError('');

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError('New password and confirmation password do not match.');
      return;
    }

    if (pwdForm.currentPassword === pwdForm.newPassword) {
      setPwdError('New password cannot be identical to your current password.');
      return;
    }

    setPwdLoading(true);

    try {
      const res = await authService.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
        confirmPassword: pwdForm.confirmPassword
      });

      if (res?.success) {
        setPwdSuccess('Password changed successfully. Please note: all other active sessions have been invalidated.');
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPwdSuccess(''), 5000);
      } else {
        setPwdError(res?.message || 'Failed to change password.');
      }
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">System & Account Settings</h2>
        <p className="text-xs text-bright-textMuted mt-1">
          Configure security credentials, role access control, and environment preferences.
        </p>
      </div>

      {/* User Profile Dossier */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <User size={18} className="text-bright-violet" />
          <span>User Profile Information</span>
        </h3>

        {profileSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check size={16} />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
              alt={user?.name || "User"}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-[#8524E5]"
            />
            <div>
              <div className="font-bold text-white text-sm">{user?.name}</div>
              <div className="text-[11px] text-bright-textMuted">{user?.email}</div>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8524E5]/30 text-white border border-[#8524E5]/40">
                Active Role: {user?.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-bright-textMuted mb-1 font-semibold">Name</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-semibold">Corporate Email</label>
              <input
                type="email"
                required
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
          </div>

          <div>
            <label className="block text-bright-textMuted mb-1 font-semibold">Phone Number</label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileLoading}
              className="px-6 py-2.5 rounded-full bg-bright-violet hover:bg-bright-violetHover text-white font-bold transition shadow-lg shadow-bright-violet/30 active:scale-95 disabled:opacity-50"
            >
              {profileLoading ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* CHANGE PASSWORD SECTION (PATCH /api/auth/change-password) */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Key size={18} className="text-[#f2c400]" />
          <span>Security & Change Password</span>
        </h3>
        <p className="text-xs text-bright-textMuted">
          Ensure your account is using a strong password (more than 8 characters, uppercase, lowercase, special character).
        </p>

        {pwdSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check size={16} />
            <span>{pwdSuccess}</span>
          </div>
        )}

        {pwdError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{pwdError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div>
            <label className="block text-bright-textMuted mb-1 font-semibold">Current Password</label>
            <input
              type="password"
              required
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-bright-textMuted mb-1 font-semibold">New Password</label>
              <input
                type="password"
                required
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
                placeholder="NewPassword@123"
              />
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-semibold">Confirm New Password</label>
              <input
                type="password"
                required
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
                placeholder="NewPassword@123"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={pwdLoading}
              className="px-6 py-2.5 rounded-full bg-[#f2c400] hover:bg-[#dbae00] text-[#1c1228] font-bold transition shadow-lg shadow-[#f2c400]/25 active:scale-95 disabled:opacity-50"
            >
              {pwdLoading ? 'Updating Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Security Best Practices & Policies */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Shield size={18} className="text-emerald-400" />
          <span>Account Security & Session Policy</span>
        </h3>
        <p className="text-xs text-bright-textMuted">
          BrightLoop secures your account with bcrypt cryptographic hashing, HTTP-only refresh tokens, and automated session invalidation on password change.
        </p>
        <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 text-xs space-y-1.5 text-purple-200">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            <span>Role-Based Access Control enforced on all endpoints</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            <span>Cryptographic token rotation and automatic session expiration</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            <span>Rate-limited authentication gateways to prevent brute-force attacks</span>
          </div>
        </div>
      </div>
    </div>
  );
};
