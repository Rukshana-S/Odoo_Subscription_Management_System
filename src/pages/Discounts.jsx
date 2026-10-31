import React, { useState } from 'react';
import { Plus, Search, Percent, Tag, Calendar, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Modal, StatusBadge, ConfirmDialog, EmptyState } from '../components/common/UIComponents';

export const Discounts = () => {
  const { discounts, addDiscount, updateDiscount, deleteDiscount, products, globalSearch } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    type: 'Percentage',
    value: 10,
    minPurchase: 1000,
    minQuantity: 1,
    applicableProducts: ['All'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2025-12-31',
    usageLimit: 50
  });

  const effectiveSearch = globalSearch || searchTerm;

  const filteredDiscounts = discounts.filter(d =>
    d.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
    d.type.toLowerCase().includes(effectiveSearch.toLowerCase())
  );

  const handleOpenAdd = () => {
    setForm({
      name: '',
      type: 'Percentage',
      value: 10,
      minPurchase: 1000,
      minQuantity: 1,
      applicableProducts: ['All'],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2025-12-31',
      usageLimit: 50
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    addDiscount(form);
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteTargetId) {
      deleteDiscount(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  // Determine automatic validity status
  const getComputedStatus = (d) => {
    const now = new Date();
    const expiry = new Date(d.endDate);
    if (d.usageCount >= d.usageLimit) return 'Exhausted';
    if (now > expiry) return 'Expired';
    return 'Active';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Discounts & Coupon Rules</h2>
          <p className="text-xs text-bright-textMuted mt-1">
            Configure fixed and percentage promotional rules, purchase thresholds, and usage limits.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8524E5] hover:bg-[#7022B9] text-white text-xs font-bold transition shadow-lg shadow-[#8524E5]/30 active:scale-95"
        >
          <Plus size={16} />
          <span>New Discount Rule</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="glass-card p-3 rounded-2xl border border-white/5 flex items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-bright-textMuted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search promo codes or discount rules..."
            className="w-full pl-10 pr-4 py-2 bg-black/20 rounded-xl text-xs text-white border border-white/10 focus:outline-none focus:border-bright-violet"
          />
        </div>
      </div>

      {/* Discounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredDiscounts.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              message="No discount rules found"
              actionText="Create Coupon"
              onAction={handleOpenAdd}
            />
          </div>
        ) : (
          filteredDiscounts.map((d) => {
            const computedStatus = getComputedStatus(d);
            const usagePercent = Math.min(100, Math.round((d.usageCount / d.usageLimit) * 100));

            return (
              <div
                key={d.id}
                className="glass-card rounded-3xl p-5 border border-white/10 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white">
                      {d.type}
                    </span>
                    <button
                      onClick={() => setDeleteTargetId(d.id)}
                      className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="text-lg font-black text-[#f2c400] font-mono tracking-wider">{d.name}</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {d.type === 'Percentage' ? `${d.value}% OFF` : `₹${d.value} FLAT`}
                  </div>

                  <div className="mt-4 p-3 rounded-2xl bg-black/20 border border-white/5 space-y-1.5 text-xs text-bright-textMuted">
                    <div className="flex justify-between">
                      <span>Min Purchase:</span>
                      <span className="text-white font-mono font-medium">₹{d.minPurchase}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Quantity:</span>
                      <span className="text-white font-mono font-medium">{d.minQuantity} item(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expiry:</span>
                      <span className="text-white font-mono">{d.endDate}</span>
                    </div>
                  </div>

                  {/* Usage Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-bright-textMuted mb-1 font-semibold">
                      <span>Redemption: {d.usageCount} / {d.usageLimit}</span>
                      <span>{usagePercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                      <div
                        className="h-full bg-bright-violet rounded-full transition-all"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-bright-textMuted">{d.id}</span>
                  <StatusBadge status={computedStatus} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Discount Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Promotional Discount Rule"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-bright-textMuted mb-1 font-medium">Coupon Code / Rule Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet font-mono uppercase"
              placeholder="e.g. FLASH20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Discount Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              >
                <option value="Percentage" className="bg-[#241733]">Percentage (%)</option>
                <option value="Fixed" className="bg-[#241733]">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Discount Value</label>
              <input
                type="number"
                required
                min="1"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Min Purchase Amount (₹)</label>
              <input
                type="number"
                value={form.minPurchase}
                onChange={(e) => setForm({ ...form, minPurchase: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Usage Limit (Redemptions)</label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white/10 text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-bright-violet hover:bg-bright-violetHover text-white font-bold transition shadow-lg shadow-bright-violet/30"
            >
              Save Rule
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Discount"
        message="Are you sure you want to delete this discount rule? It will no longer apply to new quotations."
        confirmText="Confirm Delete"
        isDanger={true}
      />
    </div>
  );
};

