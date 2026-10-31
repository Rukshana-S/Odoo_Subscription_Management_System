import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Clock, Calendar, ShieldAlert, Pause, RefreshCw } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Modal, ConfirmDialog, StatusBadge, EmptyState } from '../components/common/UIComponents';

export const SubscriptionPlans = () => {
  const { plans, addPlan, updatePlan, deletePlan } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 1560,
    billingInterval: 'Monthly',
    minQuantity: 1,
    availableFrom: '2024-01-01',
    availableUntil: '2026-12-31',
    autoClose: false,
    earlyClosure: true,
    pauseOption: true,
    renewalOption: true,
    status: 'Active'
  });

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setForm({
      name: '',
      description: '',
      price: 1560,
      billingInterval: 'Monthly',
      minQuantity: 1,
      availableFrom: new Date().toISOString().split('T')[0],
      availableUntil: '2026-12-31',
      autoClose: false,
      earlyClosure: true,
      pauseOption: true,
      renewalOption: true,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billingInterval: plan.billingInterval,
      minQuantity: plan.minQuantity,
      availableFrom: plan.availableFrom,
      availableUntil: plan.availableUntil,
      autoClose: plan.autoClose,
      earlyClosure: plan.earlyClosure,
      pauseOption: plan.pauseOption,
      renewalOption: plan.renewalOption,
      status: plan.status
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingPlan) {
      updatePlan(editingPlan.id, form);
    } else {
      addPlan(form);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deletePlan(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Subscription Plans</h2>
          <p className="text-xs text-bright-textMuted mt-1">
            Configure recurring recurring billing cycles, limits, intervals and lifecycle rules.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8524E5] hover:bg-[#7022B9] text-white text-xs font-bold transition shadow-lg shadow-[#8524E5]/30 active:scale-95"
        >
          <Plus size={16} />
          <span>Create Plan</span>
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => {
          const isYearly = p.billingInterval === 'Yearly';
          return (
            <div
              key={p.id}
              className={`glass-card rounded-3xl p-6 border transition-all flex flex-col justify-between relative overflow-hidden ${
                isYearly ? 'border-bright-violet/50 shadow-2xl' : 'border-white/10'
              }`}
            >
              {isYearly && (
                <div className="absolute top-0 right-0 bg-[#8524E5] text-white text-[9px] uppercase tracking-widest font-black py-1 px-4 rounded-bl-xl shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-bright-yellow">
                    {p.billingInterval}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(p.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-1.5">{p.name}</h3>
                <p className="text-xs text-bright-textMuted line-clamp-2 mb-4">{p.description}</p>

                <div className="mb-4">
                  <span className="text-3xl font-black text-white">₹{p.price.toLocaleString()}</span>
                  <span className="text-xs text-bright-textMuted font-mono"> / {p.billingInterval.toLowerCase()}</span>
                </div>

                {/* Plan Lifecycle Badges & Rules */}
                <div className="space-y-2 py-3 border-t border-b border-white/5 text-[11px]">
                  <div className="flex items-center justify-between text-bright-textMuted">
                    <span>Min. Order Qty</span>
                    <span className="text-white font-bold">{p.minQuantity} unit</span>
                  </div>
                  <div className="flex items-center justify-between text-bright-textMuted">
                    <span>Early Closure</span>
                    <span className={p.earlyClosure ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                      {p.earlyClosure ? 'Permitted' : 'Locked'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-bright-textMuted">
                    <span>Pause Support</span>
                    <span className={p.pauseOption ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                      {p.pauseOption ? 'Allowed' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-bright-textMuted">
                    <span>Auto Renewal</span>
                    <span className={p.renewalOption ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                      {p.renewalOption ? 'Automatic' : 'Manual'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2">
                <div className="text-[10px] text-bright-textMuted flex items-center justify-between mb-3">
                  <span>Validity: {p.availableUntil}</span>
                  <StatusBadge status={p.status} />
                </div>
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="w-full py-2.5 rounded-full bg-white/5 hover:bg-bright-violet text-white text-xs font-semibold transition"
                >
                  Configure Rules
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? "Edit Subscription Plan" : "Create New Subscription Plan"}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-bright-textMuted mb-1 font-medium">Plan Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              placeholder="e.g. Enterprise Annual Pro"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Price (₹)</label>
              <input
                type="number"
                required
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Billing Interval</label>
              <select
                value={form.billingInterval}
                onChange={(e) => setForm({ ...form, billingInterval: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              >
                <option value="Daily" className="bg-[#241733]">Daily</option>
                <option value="Weekly" className="bg-[#241733]">Weekly</option>
                <option value="Monthly" className="bg-[#241733]">Monthly</option>
                <option value="Yearly" className="bg-[#241733]">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Min Quantity</label>
              <input
                type="number"
                required
                min="1"
                value={form.minQuantity}
                onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Available From</label>
              <input
                type="date"
                value={form.availableFrom}
                onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Available Until</label>
              <input
                type="date"
                value={form.availableUntil}
                onChange={(e) => setForm({ ...form, availableUntil: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
          </div>

          {/* Toggle Switches for Plan Controls */}
          <div className="p-3.5 rounded-2xl bg-black/25 border border-white/10 space-y-2.5">
            <span className="font-bold text-white block mb-1">Subscription Policies & Lifecycle Rules</span>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-bright-textMuted">Allow Early Closure before expiration</span>
              <input
                type="checkbox"
                checked={form.earlyClosure}
                onChange={(e) => setForm({ ...form, earlyClosure: e.target.checked })}
                className="w-4 h-4 rounded text-bright-violet focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-bright-textMuted">Allow Customers to Pause Subscription</span>
              <input
                type="checkbox"
                checked={form.pauseOption}
                onChange={(e) => setForm({ ...form, pauseOption: e.target.checked })}
                className="w-4 h-4 rounded text-bright-violet focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-bright-textMuted">Enable Automatic Renewal Cycle</span>
              <input
                type="checkbox"
                checked={form.renewalOption}
                onChange={(e) => setForm({ ...form, renewalOption: e.target.checked })}
                className="w-4 h-4 rounded text-bright-violet focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-bright-textMuted">Auto-Close upon contract expiry</span>
              <input
                type="checkbox"
                checked={form.autoClose}
                onChange={(e) => setForm({ ...form, autoClose: e.target.checked })}
                className="w-4 h-4 rounded text-bright-violet focus:ring-0"
              />
            </label>
          </div>

          <div>
            <label className="block text-bright-textMuted mb-1 font-medium">Description</label>
            <textarea
              rows="2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              placeholder="Terms, tier capabilities, and service highlights"
            />
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
              {editingPlan ? "Save Plan Rules" : "Create Plan"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Plan"
        message="Are you sure you want to delete this subscription plan? Existing subscriptions will maintain historical links."
        confirmText="Confirm Delete"
        isDanger={true}
      />
    </div>
  );
};

