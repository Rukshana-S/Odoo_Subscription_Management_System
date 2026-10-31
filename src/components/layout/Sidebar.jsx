import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  FileText,
  Repeat,
  Receipt,
  Percent,
  CreditCard,
  BarChart3,
  Settings,
  HelpCircle,
  Zap,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useData();
  const navigate = useNavigate();

  // Navigation Items per Role
  const adminNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Subscription Plans', path: '/plans', icon: Layers },
    { name: 'Quotations', path: '/quotations', icon: FileText },
    { name: 'Subscriptions', path: '/subscriptions', icon: Repeat },
    { name: 'Invoices', path: '/invoices', icon: Receipt },
    { name: 'Discounts', path: '/discounts', icon: Percent },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const staffNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Subscription Plans', path: '/plans', icon: Layers },
    { name: 'Quotations', path: '/quotations', icon: FileText },
    { name: 'Subscriptions', path: '/subscriptions', icon: Repeat },
    { name: 'Invoices', path: '/invoices', icon: Receipt },
    { name: 'Discounts', path: '/discounts', icon: Percent },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Reports', path: '/reports', icon: BarChart3 }
  ];

  const customerNavItems = [
    { name: 'My Dashboard', path: '/customer-portal', icon: LayoutDashboard },
    { name: 'My Subscriptions', path: '/subscriptions', icon: Repeat },
    { name: 'My Invoices', path: '/invoices', icon: Receipt },
    { name: 'My Payments', path: '/payments', icon: CreditCard },
    { name: 'My Profile', path: '/settings', icon: Settings },
  ];

  const displayedNav = user?.role === 'Customer'
    ? customerNavItems
    : user?.role === 'Staff'
      ? staffNavItems
      : adminNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-screen transition-transform duration-300 ease-in-out bg-[#20142e] border-r border-white/5 flex flex-col justify-between
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 lg:w-20 xl:w-64`}
      >
        <div>
          {/* Logo Section */}
          <div className="h-20 flex items-center px-5 gap-3 border-b border-white/5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8524E5] to-[#f2c400] flex items-center justify-center shadow-lg shadow-[#8524E5]/30">
              <Zap className="text-white fill-white" size={20} />
            </div>
            <div className="lg:hidden xl:block">
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                BRIGHT<span className="text-[#f2c400]">LOOP</span>
              </h1>
              <p className="text-[10px] text-bright-textMuted font-medium uppercase tracking-widest">
                Subscription Cloud
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-230px)]">
            {displayedNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group
                    ${isActive
                      ? 'bg-[#8524E5] text-white shadow-lg shadow-[#8524E5]/30'
                      : 'text-bright-textMuted hover:text-white hover:bg-white/[0.04]'
                    }
                  `}
                  title={item.name}
                >
                  <div className="flex items-center justify-center min-w-[24px]">
                    <Icon size={19} className="transition-transform group-hover:scale-110" />
                  </div>
                  <span className="lg:hidden xl:inline whitespace-nowrap">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: User Session & Logout */}
        <div className="p-3 border-t border-white/5 space-y-2">
          {/* Authenticated User Status Card */}
          {user && (
            <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-bold text-xs truncate">{user.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-bright-violet/30 text-white border border-bright-violet/40">
                  {user.role}
                </span>
              </div>
              <div className="text-[10px] text-bright-textMuted truncate">{user.email}</div>
            </div>
          )}

          {/* Logout Action */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 transition group"
            title="Log Out"
          >
            <div className="flex items-center gap-2.5">
              <LogOut size={16} className="transition-transform group-hover:-translate-x-0.5" />
              <span className="lg:hidden xl:inline">Log Out</span>
            </div>
            <span className="text-[10px] text-bright-textMuted lg:hidden xl:inline">Secure Exit</span>
          </button>
        </div>
      </aside>
    </>
  );
};
