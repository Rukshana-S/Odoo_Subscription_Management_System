import React, { useState } from 'react';
import { Plus, Search, CreditCard, DollarSign, CheckCircle2, ArrowDownLeft, Calendar } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Modal, EmptyState } from '../components/common/UIComponents';
import { formatINR } from '../utils/formatters';

export const Payments = () => {
  const { payments, invoices, recordPayment, globalSearch, user } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    invoiceId: invoices.find(i => i.balanceDue > 0)?.id || invoices[0]?.id || '',
    amount: '',
    paymentMethod: 'UPI',
    notes: 'Standard payment settlement'
  });

  const effectiveSearch = globalSearch || searchTerm;

  const filteredPayments = payments.filter(p => {
    if (user.role === 'Customer' && user.customerId && p.customerId !== user.customerId) {
      return false;
    }
    const matchesSearch =
      p.id.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      p.customerName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(effectiveSearch.toLowerCase());
    const matchesMethod = methodFilter === 'All' || p.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const handleOpenAdd = () => {
    const defaultPendingInv = invoices.find(i => i.balanceDue > 0) || invoices[0];
    setForm({
      invoiceId: defaultPendingInv?.id || '',
      amount: defaultPendingInv?.balanceDue || 1000.00,
      paymentMethod: 'UPI',
      notes: `Payment for ${defaultPendingInv?.invoiceNumber || 'Invoice'}`
    });
    setIsModalOpen(true);
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    const inv = invoices.find(i => i.id === form.invoiceId);
    if (!inv) return;

    recordPayment({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerId: inv.customerId,
      customerName: inv.customerName,
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod,
      notes: form.notes
    });

    setIsModalOpen(false);
  };

  const totalCollected = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Payments & Transactions</h2>
          <p className="text-xs text-bright-textMuted mt-1">
            Reconcile customer collections, partial disbursements, and audit logs.
          </p>
        </div>
        {user.role !== 'Customer' && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8524E5] hover:bg-[#7022B9] text-white text-xs font-bold transition shadow-lg shadow-[#8524E5]/30 active:scale-95"
          >
            <Plus size={16} />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      {/* KPI summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/5">
          <span className="text-[10px] uppercase font-bold text-bright-textMuted">Total Collected</span>
          <div className="text-2xl font-black text-white mt-1">{formatINR(totalCollected)}</div>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">Across all settlement methods</span>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-white/5">
          <span className="text-[10px] uppercase font-bold text-bright-textMuted">Total Receipts</span>
          <div className="text-2xl font-black text-white mt-1">{payments.length}</div>
          <span className="text-[10px] text-bright-textMuted mt-0.5 block">Verified transactions</span>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-white/5">
          <span className="text-[10px] uppercase font-bold text-bright-textMuted">Primary Channel</span>
          <div className="text-2xl font-black text-[#f2c400] mt-1">UPI / Direct NEFT</div>
          <span className="text-[10px] text-bright-textMuted mt-0.5 block">Instant confirmation</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 glass-card p-3 rounded-2xl border border-white/5">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-3 text-bright-textMuted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payments by transaction ID, invoice or customer..."
            className="w-full pl-10 pr-4 py-2 bg-black/20 rounded-xl text-xs text-white border border-white/10 focus:outline-none focus:border-bright-violet"
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-2 bg-black/20 rounded-xl text-xs text-white border border-white/10 focus:outline-none focus:border-bright-violet"
        >
          <option value="All" className="bg-[#241733]">All Methods</option>
          <option value="UPI" className="bg-[#241733]">UPI</option>
          <option value="Bank Transfer" className="bg-[#241733]">Bank Transfer</option>
          <option value="Card" className="bg-[#241733]">Card</option>
          <option value="Cash" className="bg-[#241733]">Cash</option>
        </select>
      </div>

      {/* Payments History Table */}
      <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-bright-textMuted">
            <thead className="bg-black/30 text-white font-semibold uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-4 px-5">Receipt ID</th>
                <th className="py-4 px-4">Invoice Reference</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Method</th>
                <th className="py-4 px-4">Amount Paid</th>
                <th className="py-4 px-4">Date & Time</th>
                <th className="py-4 px-5 text-right">Transaction Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8">
                    <EmptyState
                      message="No payment transactions recorded"
                      actionText="Record Payment"
                      onAction={handleOpenAdd}
                    />
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-5 font-mono text-white font-bold">
                      {p.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-bright-violet font-semibold">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {p.customerName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-bright-textMuted">
                      {p.paymentDate}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-[10px] text-bright-textMuted">
                      {p.transactionRef}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Received Payment"
      >
        <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
          <div>
            <label className="block text-bright-textMuted mb-1 font-medium">Link Invoice</label>
            <select
              value={form.invoiceId}
              onChange={(e) => {
                const inv = invoices.find(i => i.id === e.target.value);
                setForm({
                  ...form,
                  invoiceId: e.target.value,
                  amount: inv ? inv.balanceDue : form.amount
                });
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
            >
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id} className="bg-[#241733]">
                  {inv.invoiceNumber} - {inv.customerName} (Bal: {formatINR(inv.balanceDue)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Payment Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet font-mono"
              />
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              >
                <option value="UPI" className="bg-[#241733]">UPI / Instant</option>
                <option value="Bank Transfer" className="bg-[#241733]">Bank Transfer</option>
                <option value="Card" className="bg-[#241733]">Card</option>
                <option value="Cash" className="bg-[#241733]">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-bright-textMuted mb-1 font-medium">Transaction Remarks</label>
            <textarea
              rows="2"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
            />
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
              Save Receipt
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
