import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Repeat,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useData } from '../context/DataContext';
import { monthlyOverview, upcomingPaymentsFeed } from '../data/mockData';
import { Modal, StatusBadge } from '../components/common/UIComponents';
import { formatINR } from '../utils/formatters';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { subscriptions, customers, plans, invoices, payments, addSubscription } = useData();

  // Quick New Subscription Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubForm, setNewSubForm] = useState({
    customerId: customers[0]?.id || '',
    planId: plans[0]?.id || '',
    startDate: new Date().toISOString().split('T')[0],
    billingInterval: 'Monthly',
    quantity: 1,
    paymentTerms: 'Net 15'
  });

  // Calculate high-level KPIs
  const activeSubs = subscriptions.filter(s => s.status === 'Active');
  const mrr = activeSubs.reduce((acc, s) => {
    if (s.billingInterval === 'Monthly') return acc + Number(s.totalAmount);
    if (s.billingInterval === 'Yearly') return acc + (Number(s.totalAmount) / 12);
    if (s.billingInterval === 'Weekly') return acc + (Number(s.totalAmount) * 4);
    return acc + Number(s.totalAmount);
  }, 0);

  const outstandingBalance = invoices
    .filter(i => i.status !== 'Paid' && i.status !== 'Cancelled')
    .reduce((acc, i) => acc + Number(i.balanceDue || 0), 0);

  const overdueInvoicesCount = invoices.filter(i => i.status === 'Overdue').length;

  const handleCreateQuickSub = (e) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === newSubForm.customerId) || customers[0];
    const plan = plans.find(p => p.id === newSubForm.planId) || plans[0];
    const unitPrice = plan.price * Number(newSubForm.quantity);
    const taxAmount = unitPrice * 0.18;
    const totalAmount = unitPrice + taxAmount;

    addSubscription({
      customerId: customer.id,
      customerName: customer.name,
      planId: plan.id,
      planName: plan.name,
      productId: 'PROD-001',
      variantName: 'Standard',
      startDate: newSubForm.startDate,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      billingInterval: plan.billingInterval || newSubForm.billingInterval,
      quantity: Number(newSubForm.quantity),
      unitPrice,
      taxRate: 18,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      paymentTerms: newSubForm.paymentTerms,
      status: 'Active'
    });

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HERO SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to <span className="text-bright-violet">Brightloop</span>
          </h2>
          <p className="text-xs sm:text-sm text-bright-textMuted mt-1">
            View, progress and manage subscription efficiently
          </p>
        </div>

        {/* Prominent Yellow Button from Reference Screenshot */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#F2C400] hover:bg-[#dbae00] text-[#1c1228] font-bold text-xs uppercase tracking-wider transition-transform active:scale-95 shadow-lg shadow-[#F2C400]/25"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between text-bright-textMuted mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Subs</span>
            <Repeat size={16} className="text-[#8524E5]" />
          </div>
          <div className="text-2xl font-bold text-white">{activeSubs.length}</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">+12% vs last month</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between text-bright-textMuted mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">MRR</span>
            <DollarSign size={16} className="text-[#f2c400]" />
          </div>
          <div className="text-2xl font-bold text-white">{formatINR(mrr)}</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-medium">+18.4% recurring growth</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between text-bright-textMuted mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Outstanding</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{formatINR(outstandingBalance)}</div>
          <div className="text-[10px] text-amber-300 mt-1 font-medium">{invoices.filter(i => i.balanceDue > 0).length} invoices pending</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between text-bright-textMuted mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Overdue Alerts</span>
            <AlertCircle size={16} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white">{overdueInvoicesCount}</div>
          <div className="text-[10px] text-rose-400 mt-1 font-medium">Requires follow-up</div>
        </div>
      </div>

      {/* 2. SPLIT LAYOUT: LEFT (SUBSCRIPTIONS & CHART) + RIGHT (MONTH OVERVIEW & UPCOMING) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ================= LEFT SECTION (8 Cols) ================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          
          {/* A. MY SUBSCRIPTIONS CARD */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">My subscriptions</h3>
                <span className="text-xs text-bright-textMuted">{activeSubs.length} active</span>
              </div>
              <button 
                onClick={() => navigate('/subscriptions')}
                className="text-xs text-bright-violet hover:text-white flex items-center gap-1 transition"
              >
                Manage <ArrowUpRight size={14} />
              </button>
            </div>

            {/* Subscriptions Mini List matching reference layout with Tamil names */}
            <div className="space-y-4">
              {subscriptions.slice(0, 3).map((sub) => (
                <div 
                  key={sub.id} 
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/[0.02] px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={sub.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                      alt={sub.customerName}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-[#8524E5]/40 flex-shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white truncate">{sub.customerName}</div>
                      <div className="text-[11px] text-bright-textMuted truncate">{sub.planName}</div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-4">
                    <div className={`text-xs font-semibold ${sub.renewalAlert?.includes('today') ? 'text-amber-400' : 'text-bright-textMuted'}`}>
                      {sub.renewalAlert || `Next: ${sub.nextBillingDate}`}
                    </div>
                    <div className="text-[10px] text-bright-textMuted font-mono">
                      {formatINR(sub.totalAmount)} / {sub.billingInterval}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pill Action Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => navigate('/subscriptions')}
                className="px-6 py-2.5 rounded-full bg-[#8524E5] hover:bg-[#7022B9] text-white text-xs font-semibold transition-all shadow-md shadow-[#8524E5]/30 active:scale-95"
              >
                View all subscriptions
              </button>
            </div>
          </div>

          {/* B. TOTAL SUBSCRIPTIONS CHART CARD */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Total subscriptions</h3>
                <span className="text-xs text-bright-textMuted">Annual Subscriptions Overview (Jan - Dec)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-bright-textMuted">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#8524E5]"></span> Revenue
                </span>
                <span className="flex items-center gap-1 text-bright-textMuted">
                  <span className="w-2.5 h-2.5 rounded-sm bg-white/40"></span> Active Subs
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="month" 
                    stroke="#C5B9D0" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                  />
                  <YAxis 
                    stroke="#C5B9D0" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickFormatter={(val) => `${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#2a1a3b', 
                      borderColor: 'rgba(255,255,255,0.15)', 
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px'
                    }} 
                    formatter={(value, name) => [
                      name === 'Revenue (₹)' ? formatINR(value) : value,
                      name
                    ]}
                  />
                  <Bar dataKey="count" fill="rgba(255,255,255,0.45)" radius={[4, 4, 0, 0]} name="Active Subs" />
                  <Bar dataKey="revenue" fill="#8524E5" radius={[4, 4, 0, 0]} name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SECTION ================= */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          
          {/* A. CURRENT MONTH OVERVIEW */}
          <div className="glass-card-sec rounded-3xl p-5 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-3">Current Month Overview</h3>
            <div className="grid grid-cols-6 gap-1 bg-black/20 p-2 rounded-2xl border border-white/5">
              {monthlyOverview.slice(0, 6).map((item, idx) => (
                <div 
                  key={item.month} 
                  className={`text-center py-2 px-1 rounded-xl transition ${
                    idx === 1 ? 'bg-white/10 border border-white/20' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="text-[10px] text-bright-textMuted font-medium">{item.month}</div>
                  <div className={`text-xs font-bold mt-1 ${idx === 1 ? 'text-[#f2c400]' : 'text-white'}`}>
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B. UPCOMING PAYMENT THIS MONTH */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Upcoming payment this month</h3>
              <span className="text-[10px] text-bright-textMuted">5 scheduled</span>
            </div>

            <div className="space-y-2.5">
              {upcomingPaymentsFeed.map((item, idx) => {
                const isSelected = idx === 1;
                return (
                  <div
                    key={item.day}
                    className={`flex items-center justify-between p-3 rounded-2xl transition border ${
                      isSelected
                        ? 'bg-black/40 border-bright-violet/50 shadow-md'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs text-white">
                        {item.day}
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-white leading-tight">{item.title}</div>
                        <div className="text-[10px] text-bright-textMuted">{item.desc} • <span className="text-white/80">{item.customer}</span></div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] text-bright-textMuted font-mono">{item.time}</div>
                      <div className="text-[11px] font-bold text-white mt-0.5">{formatINR(item.amount)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View Full List Violet Pill Button */}
            <div className="pt-2">
              <button
                onClick={() => navigate('/payments')}
                className="w-full py-3 rounded-full bg-[#8524E5] hover:bg-[#7022B9] text-white text-xs font-bold transition-all shadow-lg shadow-[#8524E5]/25 active:scale-95"
              >
                View full list
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Add Subscription Quick Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Subscription">
        <form onSubmit={handleCreateQuickSub} className="space-y-4 text-xs">
          <div>
            <label className="block text-bright-textMuted mb-1 font-medium">Select Customer</label>
            <select
              value={newSubForm.customerId}
              onChange={(e) => setNewSubForm({ ...newSubForm, customerId: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              required
            >
              {customers.map(c => (
                <option key={c.id} value={c.id} className="bg-[#241733] text-white">
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Subscription Plan</label>
              <select
                value={newSubForm.planId}
                onChange={(e) => setNewSubForm({ ...newSubForm, planId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#241733] text-white">
                    {p.name} - {formatINR(p.price)}/{p.billingInterval}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Quantity</label>
              <input
                type="number"
                min="1"
                value={newSubForm.quantity}
                onChange={(e) => setNewSubForm({ ...newSubForm, quantity: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Start Date</label>
              <input
                type="date"
                value={newSubForm.startDate}
                onChange={(e) => setNewSubForm({ ...newSubForm, startDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
                required
              />
            </div>

            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Payment Terms</label>
              <select
                value={newSubForm.paymentTerms}
                onChange={(e) => setNewSubForm({ ...newSubForm, paymentTerms: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              >
                <option value="Immediate" className="bg-[#241733]">Immediate</option>
                <option value="Net 15" className="bg-[#241733]">Net 15 Days</option>
                <option value="Net 30" className="bg-[#241733]">Net 30 Days</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#8524E5]/15 border border-[#8524E5]/30 text-purple-200">
            <div className="flex justify-between font-bold">
              <span>Standard Tax (GST 18%):</span>
              <span>Calculated at checkout</span>
            </div>
            <p className="text-[10px] text-bright-textMuted mt-1">
              Automatic recurring invoice will be scheduled on renewal cycles.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-bright-violet hover:bg-bright-violetHover text-white font-bold transition shadow-lg shadow-bright-violet/30"
            >
              Confirm Subscription
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
