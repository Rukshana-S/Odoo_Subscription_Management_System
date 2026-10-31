import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  XCircle,
  Eye,
  FileCheck2,
  Calendar,
  Layers,
  Clock
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { StatusBadge, Modal, ConfirmDialog, EmptyState } from '../components/common/UIComponents';
import { formatINR } from '../utils/formatters';

export const Subscriptions = () => {
  const {
    subscriptions,
    customers,
    plans,
    products,
    addSubscription,
    updateSubscription,
    changeSubscriptionStatus,
    globalSearch,
    user
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewSub, setViewSub] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    customerId: customers[0]?.id || '',
    planId: plans[0]?.id || '',
    productId: products[0]?.id || '',
    variantName: 'Standard',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quantity: 1,
    unitPrice: 1560.00,
    paymentTerms: 'Net 15',
    status: 'Draft'
  });

  const effectiveSearch = globalSearch || searchTerm;

  // Filter subscriptions - if logged in as customer, show only their subscriptions
  const filteredSubs = subscriptions.filter(s => {
    if (user.role === 'Customer' && user.customerId && s.customerId !== user.customerId) {
      return false;
    }
    const matchesSearch =
      s.id.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      s.customerName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      s.planName.toLowerCase().includes(effectiveSearch.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePlanSelect = (planId) => {
    const selectedPlan = plans.find(p => p.id === planId);
    if (selectedPlan) {
      const price = selectedPlan.price;
      setForm({
        ...form,
        planId,
        unitPrice: price,
        billingInterval: selectedPlan.billingInterval
      });
    }
  };

  const handleCreateSubscription = (e) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === form.customerId) || customers[0];
    const plan = plans.find(p => p.id === form.planId) || plans[0];
    const qty = Number(form.quantity) || 1;
    const subtotal = Number(form.unitPrice) * qty;
    const taxAmount = subtotal * 0.18;
    const totalAmount = subtotal + taxAmount;

    addSubscription({
      ...form,
      customerId: customer.id,
      customerName: customer.name,
      planName: plan.name,
      billingInterval: plan.billingInterval,
      quantity: qty,
      unitPrice: Number(form.unitPrice),
      taxAmount,
      totalAmount,
      status: 'Confirmed'
    });

    setIsModalOpen(false);
  };

  const handleLifecycleChange = (id, newStatus) => {
    changeSubscriptionStatus(id, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Active Subscriptions</h2>
          <p className="text-xs text-bright-textMuted mt-1">
            Complete lifecycle management: Draft → Quotation → Confirmed → Active → Paused / Closed.
          </p>
        </div>
        {user.role !== 'Customer' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8524E5] hover:bg-[#7022B9] text-white text-xs font-bold transition shadow-lg shadow-[#8524E5]/30 active:scale-95"
          >
            <Plus size={16} />
            <span>Create Subscription</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 glass-card p-3 rounded-2xl border border-white/5">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-3 text-bright-textMuted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subscriptions by ID, customer or plan..."
            className="w-full pl-10 pr-4 py-2 bg-black/20 rounded-xl text-xs text-white border border-white/10 focus:outline-none focus:border-bright-violet"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['All', 'Active', 'Confirmed', 'Paused', 'Draft', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-bright-violet text-white shadow-md'
                  : 'bg-white/5 text-bright-textMuted hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Data Table */}
      <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-bright-textMuted">
            <thead className="bg-black/30 text-white font-semibold uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-4 px-5">Subscription ID</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Plan & Product</th>
                <th className="py-4 px-4">Interval</th>
                <th className="py-4 px-4">Total (GST incl.)</th>
                <th className="py-4 px-4">Next Billing</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-5 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8">
                    <EmptyState
                      message="No subscriptions match this filter"
                      actionText="Create Subscription"
                      onAction={() => setIsModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-5 font-mono text-white font-bold">
                      {sub.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={sub.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                          alt={sub.customerName}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-[#8524E5]/40"
                        />
                        <span className="font-semibold text-white">{sub.customerName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">{sub.planName}</div>
                      <div className="text-[10px] text-bright-textMuted">{sub.variantName || 'Standard'} (x{sub.quantity})</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-bright-yellow">
                      {sub.billingInterval}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {formatINR(sub.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-bright-textMuted font-mono">
                      {sub.nextBillingDate || sub.expiryDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setViewSub(sub); setIsViewModalOpen(true); }}
                          title="Inspect Details"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition"
                        >
                          <Eye size={14} />
                        </button>

                        {sub.status === 'Draft' && (
                          <button
                            onClick={() => handleLifecycleChange(sub.id, 'Confirmed')}
                            title="Confirm Subscription"
                            className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}

                        {sub.status === 'Confirmed' && (
                          <button
                            onClick={() => handleLifecycleChange(sub.id, 'Active')}
                            title="Activate Subscription"
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          >
                            <PlayCircle size={14} />
                          </button>
                        )}

                        {sub.status === 'Active' && (
                          <button
                            onClick={() => handleLifecycleChange(sub.id, 'Paused')}
                            title="Pause Subscription"
                            className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                          >
                            <PauseCircle size={14} />
                          </button>
                        )}

                        {sub.status === 'Paused' && (
                          <button
                            onClick={() => handleLifecycleChange(sub.id, 'Active')}
                            title="Resume Subscription"
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          >
                            <PlayCircle size={14} />
                          </button>
                        )}

                        {sub.status !== 'Closed' && (
                          <button
                            onClick={() => handleLifecycleChange(sub.id, 'Closed')}
                            title="Close Subscription"
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Subscription Agreement"
      >
        <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
          <div>
            <label className="block text-bright-textMuted mb-1 font-medium">Customer</label>
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id} className="bg-[#241733]">
                  {c.name} - {c.company}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Subscription Plan</label>
              <select
                value={form.planId}
                onChange={(e) => handlePlanSelect(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#241733]">
                    {p.name} ({formatINR(p.price)}/{p.billingInterval})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Product Base</label>
              <select
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#241733]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Unit Price (₹)</label>
              <input
                type="number"
                required
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Payment Terms</label>
              <select
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              >
                <option value="Immediate" className="bg-[#241733]">Immediate</option>
                <option value="Net 15" className="bg-[#241733]">Net 15</option>
                <option value="Net 30" className="bg-[#241733]">Net 30</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Start Date</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Expiry Date</label>
              <input
                type="date"
                required
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#8524E5]/15 border border-[#8524E5]/30">
            <div className="flex justify-between items-center text-xs font-bold text-white mb-1">
              <span>Estimated Billing:</span>
              <span className="text-[#f2c400] font-mono text-sm">
                {formatINR(Number(form.unitPrice) * Number(form.quantity) * 1.18)}
              </span>
            </div>
            <div className="text-[10px] text-bright-textMuted">
              Subtotal: {formatINR(Number(form.unitPrice) * Number(form.quantity))} + GST 18%: {formatINR(Number(form.unitPrice) * Number(form.quantity) * 0.18)}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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

      {/* Subscription Dossier Detail Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Subscription Agreement Details"
      >
        {viewSub && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/10">
              <div>
                <div className="text-lg font-bold text-white">{viewSub.id}</div>
                <div className="text-bright-violet font-semibold">{viewSub.customerName}</div>
              </div>
              <StatusBadge status={viewSub.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] uppercase text-bright-textMuted block">Plan</span>
                <span className="text-white font-bold text-xs mt-0.5 block">{viewSub.planName}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] uppercase text-bright-textMuted block">Interval</span>
                <span className="text-[#f2c400] font-bold text-xs mt-0.5 block">{viewSub.billingInterval}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] uppercase text-bright-textMuted block">Quantity</span>
                <span className="text-white font-bold text-xs mt-0.5 block">{viewSub.quantity} unit(s)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex justify-between text-bright-textMuted">
                <span>Unit Base Price:</span>
                <span className="text-white font-mono">{formatINR(viewSub.unitPrice)}</span>
              </div>
              <div className="flex justify-between text-bright-textMuted">
                <span>Applicable GST (18%):</span>
                <span className="text-white font-mono">{formatINR(viewSub.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-white/5 text-sm">
                <span>Total Amount per cycle:</span>
                <span className="text-[#f2c400] font-mono">{formatINR(viewSub.totalAmount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] uppercase text-bright-textMuted block">Start Date</span>
                <span className="text-white font-mono mt-0.5 block">{viewSub.startDate}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] uppercase text-bright-textMuted block">Expiry Date</span>
                <span className="text-white font-mono mt-0.5 block">{viewSub.expiryDate}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-bright-violet text-white font-bold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
