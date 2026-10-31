import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Settings as SettingsIcon, User, Shield, Key, Bell, Database, Check } from 'lucide-react';

export const Settings = () => {
  const { user, setUser, switchRole } = useData();
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setUser({
      ...user,
      name: profileForm.name,
      email: profileForm.email
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <Check size={16} />
          <span>Profile configuration saved successfully.</span>
        </div>
      )}

      {/* User Profile Dossier */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <User size={18} className="text-bright-violet" />
          <span>User Profile Information</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-[#8524E5]"
            />
            <div>
              <div className="font-bold text-white text-sm">{user.name}</div>
              <div className="text-[11px] text-bright-textMuted">{user.email}</div>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8524E5]/30 text-white border border-[#8524E5]/40">
                Active Role: {user.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-bright-textMuted mb-1 font-semibold">First Name</label>
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

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-bright-violet hover:bg-bright-violetHover text-white font-bold transition shadow-lg shadow-bright-violet/30 active:scale-95"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>

      {/* Role Management with realistic Tamil Nadu personnel */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Shield size={18} className="text-[#f2c400]" />
          <span>Role-Based Access Control (RBAC)</span>
        </h3>
        <p className="text-xs text-bright-textMuted">
          Switch active user persona to preview role-based permissions and routes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            { role: 'Admin', name: 'Arul', desc: 'System administrator. Full subscription control and audit overrides.' },
            { role: 'Staff', name: 'Priya', desc: 'Staff account. Manage subscriptions, quotations, and customer records.' },
            { role: 'Customer', name: 'Kavin', desc: 'Customer account. View own subscriptions and pay invoices.' }
          ].map(r => (
            <div
              key={r.role}
              onClick={() => switchRole(r.role)}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                user.role === r.role
                  ? 'bg-[#8524E5]/25 border-bright-violet shadow-lg'
                  : 'bg-black/20 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white text-xs">{r.name} ({r.role})</span>
                {user.role === r.role && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </div>
              <p className="text-[11px] text-bright-textMuted">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* API Backend Integration Status */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Database size={18} className="text-emerald-400" />
          <span>REST API Backend Integration Status</span>
        </h3>
        <p className="text-xs text-bright-textMuted">
          Brightloop is configured to connect to your Node.js & Express REST endpoints.
        </p>
        <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 font-mono text-xs space-y-1 text-purple-200">
          <div>VITE_API_URL: <span className="text-white">http://localhost:5000/api</span></div>
          <div>Mode: <span className="text-emerald-400 font-bold">Mock Client Persistence (Online)</span></div>
          <div>Region: <span className="text-[#f2c400]">Tamil Nadu Enterprise Cluster</span></div>
        </div>
      </div>
    </div>
  );
};
