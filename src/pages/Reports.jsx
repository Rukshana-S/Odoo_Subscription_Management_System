import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Repeat,
  Calendar,
  Layers,
  ArrowUpRight,
  PieChart as PieIcon,
  Filter
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useData } from '../context/DataContext';
import { monthlyOverview } from '../data/mockData';
import { formatINR } from '../utils/formatters';

export const Reports = () => {
  const { subscriptions, invoices, payments, plans } = useData();
  const [timeRange, setTimeRange] = useState('This Year');

  // Compute Metrics
  const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const activeSubsCount = subscriptions.filter(s => s.status === 'Active').length;
  const overdueCount = invoices.filter(i => i.status === 'Overdue').length;
  const outstandingSum = invoices.reduce((acc, i) => acc + Number(i.balanceDue || 0), 0);

  // Plan Distribution for Pie Chart
  const planDistribution = plans.map(p => {
    const count = subscriptions.filter(s => s.planId === p.id).length;
    return { name: p.name, value: count || 1 };
  });

  const COLORS = ['#8524E5', '#F2C400', '#22C55E', '#3B82F6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Financial & Subscription Analytics</h2>
          <p className="text-xs text-bright-textMuted mt-1">
            Real-time revenue trajectories, plan distributions, and collection efficiency.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/25 border border-white/10 self-start sm:self-auto">
          {['This Month', 'Last Month', 'This Year', 'All Time'].map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                timeRange === r ? 'bg-bright-violet text-white shadow' : 'text-bright-textMuted hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-bright-textMuted block">Total Realized Revenue</span>
          <div className="text-2xl font-black text-white mt-1">{formatINR(totalRevenue)}</div>
          <span className="text-[10px] text-emerald-400 mt-1 block font-medium">+24.5% year over year</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-bright-textMuted block">Active Contracts</span>
          <div className="text-2xl font-black text-white mt-1">{activeSubsCount}</div>
          <span className="text-[10px] text-bright-textMuted mt-1 block">94.2% renewal rate</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-bright-textMuted block">Outstanding Invoices</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{formatINR(outstandingSum)}</div>
          <span className="text-[10px] text-amber-300 mt-1 block">Receivables pending</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-bright-textMuted block">Overdue Invoices</span>
          <div className="text-2xl font-black text-rose-400 mt-1">{overdueCount}</div>
          <span className="text-[10px] text-rose-400 mt-1 block">Critical collections</span>
        </div>
      </div>

      {/* Big Chart: Annual Revenue Growth (Area Chart) */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Monthly Recurring Revenue Growth</h3>
            <span className="text-xs text-bright-textMuted">Revenue trajectory across 2024 calendar months</span>
          </div>
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
            <TrendingUp size={16} />
            <span>+38.2% Annualized MRR</span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyOverview} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8524E5" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#8524E5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#C5B9D0" fontSize={11} tickLine={false} />
              <YAxis stroke="#C5B9D0" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#2a1a3b',
                  borderColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  color: '#ffffff'
                }}
                formatter={(val) => [formatINR(val), "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#8524E5" strokeWidth={3} fillOpacity={1} fill="url(#purpleGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Charts: Subscription Growth & Plan Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Volume */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl">
          <h3 className="text-base font-bold text-white mb-1">New Subscriptions Volume</h3>
          <span className="text-xs text-bright-textMuted block mb-4">Client adoption per month</span>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyOverview}>
                <XAxis dataKey="month" stroke="#C5B9D0" fontSize={11} tickLine={false} />
                <YAxis stroke="#C5B9D0" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#2a1a3b',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    color: '#ffffff'
                  }}
                />
                <Bar dataKey="count" fill="#F2C400" radius={[6, 6, 0, 0]} name="New Subscriptions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution (Pie) */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Subscription Share by Plan</h3>
            <span className="text-xs text-bright-textMuted block mb-4">Proportion of active recurring tiers</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#2a1a3b',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    color: '#ffffff'
                  }}
                />
                <Legend formatter={(val) => <span className="text-white text-xs">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
