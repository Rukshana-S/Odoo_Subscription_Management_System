import React, { useState } from 'react';
import { Search, Bell, Menu, Shield, Calendar, Check, ExternalLink, LogOut } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';

export const Header = ({ onToggleSidebar }) => {
  const { user, logout, globalSearch, setGlobalSearch, invoices, subscriptions } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const navigate = useNavigate();

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).toUpperCase();

  const overdueCount = invoices.filter(i => i.status === 'Overdue').length;
  const activeSubsCount = subscriptions.filter(s => s.status === 'Active').length;

  return (
    <header className="h-20 w-full flex items-center justify-between px-4 lg:px-8 border-b border-white/5 bg-[#20142e]/70 backdrop-blur-md sticky top-0 z-30">
      {/* Left Search Bar matching the reference screen pill shape */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-white/5 text-bright-textMuted hover:text-white"
        >
          <Menu size={20} />
        </button>

        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-bright-textMuted">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search subscriptions, customers, invoices or plans..."
            className="w-full pl-10 pr-10 py-2.5 rounded-full bg-black/25 border border-white/10 text-white placeholder-bright-textMuted/60 text-xs focus:outline-none focus:border-bright-violet focus:ring-1 focus:ring-bright-violet transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-white/30 text-[11px] font-mono">
            ⌘K
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Date Pill */}
        <div className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8524E5] text-white text-xs font-bold tracking-wide shadow-md shadow-[#8524E5]/20">
          <Calendar size={14} />
          <span>{formattedDate}</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-full bg-black/20 border border-white/10 text-bright-textMuted hover:text-white hover:bg-white/5 relative transition"
            title="Notifications"
          >
            <Bell size={18} />
            {overdueCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#f2c400] ring-2 ring-[#241733]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-[#2a1c3b] border border-white/10 shadow-2xl p-4 z-50 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 font-semibold text-white">
                <span>Notifications</span>
                <span className="text-[10px] text-bright-yellow">{overdueCount} Alerts</span>
              </div>
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {overdueCount > 0 && (
                  <div 
                    onClick={() => { navigate('/invoices'); setShowNotifications(false); }}
                    className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 cursor-pointer hover:bg-rose-500/20 transition"
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>Overdue Invoices</span>
                      <span className="text-[10px] underline">Review</span>
                    </div>
                    <p className="text-[11px] text-rose-200/80 mt-0.5">
                      {overdueCount} customer invoices are pending past due date.
                    </p>
                  </div>
                )}
                <div 
                  onClick={() => { navigate('/subscriptions'); setShowNotifications(false); }}
                  className="p-2.5 rounded-xl bg-[#8524E5]/15 border border-[#8524E5]/30 text-purple-200 cursor-pointer hover:bg-[#8524E5]/25 transition"
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Active Subscriptions</span>
                    <span className="text-[10px] underline">View</span>
                  </div>
                  <p className="text-[11px] text-bright-textMuted mt-0.5">
                    {activeSubsCount} recurring subscriptions currently active in system.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <div 
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-black/20 border border-white/10 cursor-pointer hover:border-white/20 transition"
          >
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
              alt={user?.name || "User"}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#8524E5]"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-white leading-tight">{user?.name || "User"}</div>
              <div className="text-[10px] text-bright-textMuted flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{user?.role || "Guest"}</span>
              </div>
            </div>
          </div>

          {showUserDropdown && (
            <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#2a1c3b] border border-white/10 shadow-2xl p-3 z-50 text-xs space-y-2">
              <div className="pb-2 border-b border-white/10">
                <div className="font-bold text-white">{user?.name}</div>
                <div className="text-[10px] text-bright-textMuted truncate">{user?.email}</div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-bright-violet/30 text-white border border-bright-violet/40">
                  {user?.role}
                </span>
              </div>

              <button
                onClick={() => { setShowUserDropdown(false); navigate('/settings'); }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/5 text-bright-textMuted hover:text-white transition"
              >
                Profile & Settings
              </button>

              <button
                onClick={() => { setShowUserDropdown(false); logout(); }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 font-semibold transition flex items-center gap-2"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
