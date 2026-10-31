import React, { useState } from 'react';
import { Plus, Search, FileText, ArrowRight, CheckCircle2, Clock, Eye, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Modal, StatusBadge, EmptyState } from '../components/common/UIComponents';
import { formatINR } from '../utils/formatters';

export const Quotations = () => {
  const { quotations, customers, plans, products, addQuotation, convertQuotationToSubscription, globalSearch } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewQuote, setViewQuote] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Form for building quotation
  const [form, setForm] = useState({
    customerId: customers[0]?.id || '',
    planId: plans[0]?.id || '',
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discount: 100.00,
    notes: 'Includes special partner onboarding discount.',
    items: [
      { productId: products[0]?.id || 'PROD-001', productName: 'Business Software Suite', qty: 1, unitPrice: 1000.00, amount: 1000.00 }
    ]
  });

  const effectiveSearch = globalSearch || searchTerm;

  const filteredQuotes = quotations.filter(q =>
    q.id.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
    q.customerName.toLowerCase().includes(effectiveSearch.toLowerCase())
  );

  const handleAddItem = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        { productId: products[0]?.id || 'PROD-001', productName: products[0]?.name || 'Product', qty: 1, unitPrice: 500.00, amount: 500.00 }
      ]
    });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...form.items];
    if (field === 'qty' || field === 'unitPrice') {
      const qty = field === 'qty' ? Number(value) : updated[index].qty;
      const unitPrice = field === 'unitPrice' ? Number(value) : updated[index].unitPrice;
      updated[index] = { ...updated[index], [field]: Number(value), amount: qty * unitPrice };
    } else if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      updated[index] = {
        ...updated[index],
        productId: value,
        productName: prod ? prod.name : 'Custom Item',
        unitPrice: prod ? prod.salesPrice : 500.00,
        amount: (prod ? prod.salesPrice : 500.00) * updated[index].qty
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setForm({ ...form, items: updated });
  };

  const removeItem = (idx) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  // Calculations
  const calculatedSubtotal = form.items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const calculatedTax = (calculatedSubtotal - Number(form.discount || 0)) * 0.18;
  const calculatedTotal = Math.max(0, calculatedSubtotal - Number(form.discount || 0) + calculatedTax);

  const handleCreateQuotation = (e) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === form.customerId) || customers[0];
    const plan = plans.find(p => p.id === form.planId) || plans[0];

    addQuotation({
      customerId: customer.id,
      customerName: customer.name,
      planId: plan.id,
      planName: plan.name,
      items: form.items,
      subtotal: calculatedSubtotal,
      discount: Number(form.discount || 0),
      tax: calculatedTax,
      total: calculatedTotal,
      validUntil: form.validUntil,
      status: 'Sent',
      notes: form.notes
    });

    setIsModalOpen(false);
  };

  const handleConvert = (quoteId) => {
    convertQuotationToSubscription(quoteId);
    alert('Quotation successfully converted to Active/Confirmed Subscription and invoice generated!');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Quotations & Proposals</h2>
          <p className="text-xs text-bright-textMuted mt-1">
            Build proposals with dynamic taxes, discounts, and one-click conversion to subscriptions.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8524E5] hover:bg-[#7022B9] text-white text-xs font-bold transition shadow-lg shadow-[#8524E5]/30 active:scale-95"
        >
          <Plus size={16} />
          <span>New Quotation</span>
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
            placeholder="Search quotations by quote ID or customer..."
            className="w-full pl-10 pr-4 py-2 bg-black/20 rounded-xl text-xs text-white border border-white/10 focus:outline-none focus:border-bright-violet"
          />
        </div>
      </div>

      {/* Quotations Table */}
      <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-bright-textMuted">
            <thead className="bg-black/30 text-white font-semibold uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-4 px-5">Quotation Ref</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Plan Basis</th>
                <th className="py-4 px-4">Subtotal</th>
                <th className="py-4 px-4">Total Payable</th>
                <th className="py-4 px-4">Valid Until</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8">
                    <EmptyState
                      message="No quotations found"
                      actionText="Create Quotation"
                      onAction={() => setIsModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-5 font-mono text-white font-bold">
                      {q.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {q.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-bright-textMuted">
                      {q.planName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white">
                      {formatINR(q.subtotal)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#f2c400]">
                      {formatINR(q.total)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-bright-textMuted">
                      {q.validUntil}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setViewQuote(q); setIsViewModalOpen(true); }}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                        >
                          <Eye size={14} />
                        </button>
                        {q.status !== 'Accepted' && (
                          <button
                            onClick={() => handleConvert(q.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bright-violet hover:bg-bright-violetHover text-white text-[11px] font-bold shadow-md transition"
                            title="Convert to Subscription"
                          >
                            <span>Convert</span>
                            <ArrowRight size={12} />
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

      {/* Quotation Creator Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Formal Quotation"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Customer</label>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#241733]">
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Subscription Plan Tier</label>
              <select
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#241733]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Quotation Items */}
          <div className="p-4 rounded-2xl bg-black/25 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white block">Quoted Line Items</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 rounded-lg bg-bright-violet/30 hover:bg-bright-violet text-white text-[11px] font-semibold transition"
              >
                + Add Line
              </button>
            </div>

            {form.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <select
                    value={item.productId}
                    onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id} className="bg-[#241733]">{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.qty}
                    onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-center"
                  />
                </div>
                <div className="col-span-3 text-right font-mono font-bold text-white">
                  {formatINR(item.amount)}
                </div>
                <div className="col-span-1 text-center">
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Promotional Discount (₹)</label>
              <input
                type="number"
                min="0"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Valid Until Date</label>
              <input
                type="date"
                required
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
          </div>

          {/* Live Calculation Card */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between text-bright-textMuted">
              <span>Subtotal:</span>
              <span className="font-mono text-white">{formatINR(calculatedSubtotal)}</span>
            </div>
            <div className="flex justify-between text-bright-textMuted">
              <span>Discount Applied:</span>
              <span className="font-mono text-emerald-400">-{formatINR(Number(form.discount || 0))}</span>
            </div>
            <div className="flex justify-between text-bright-textMuted">
              <span>Standard Tax (GST 18%):</span>
              <span className="font-mono text-white">+{formatINR(calculatedTax)}</span>
            </div>
            <div className="flex justify-between font-bold text-white pt-2 border-t border-white/10 text-sm">
              <span>Estimated Grand Total:</span>
              <span className="font-mono text-[#f2c400]">{formatINR(calculatedTotal)}</span>
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
              Dispatch Quotation
            </button>
          </div>
        </form>
      </Modal>

      {/* View Quotation Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Quotation Statement"
      >
        {viewQuote && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/10">
              <div>
                <h4 className="text-lg font-bold text-white">{viewQuote.id}</h4>
                <div className="text-bright-violet font-semibold">Prepared for: {viewQuote.customerName}</div>
              </div>
              <StatusBadge status={viewQuote.status} />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-bright-textMuted block">Line Items</span>
              {viewQuote.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-white">{it.productName} (x{it.qty})</span>
                  <span className="font-mono text-white font-bold">{formatINR(it.amount)}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <div className="flex justify-between text-bright-textMuted">
                <span>Subtotal:</span>
                <span className="text-white font-mono">{formatINR(viewQuote.subtotal)}</span>
              </div>
              <div className="flex justify-between text-bright-textMuted">
                <span>Discount:</span>
                <span className="text-emerald-400 font-mono">{formatINR(viewQuote.discount)}</span>
              </div>
              <div className="flex justify-between text-bright-textMuted">
                <span>GST:</span>
                <span className="text-white font-mono">{formatINR(viewQuote.tax)}</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-1 border-t border-white/5">
                <span>Total:</span>
                <span className="text-[#f2c400] font-mono">{formatINR(viewQuote.total)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white font-medium"
              >
                Close
              </button>
              {viewQuote.status !== 'Accepted' && (
                <button
                  onClick={() => {
                    handleConvert(viewQuote.id);
                    setIsViewModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-bright-violet text-white font-bold"
                >
                  Convert Now
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
