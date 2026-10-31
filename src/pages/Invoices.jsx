import React, { useState } from 'react';
import {
  Plus,
  Search,
  Receipt,
  Printer,
  Eye,
  CheckCircle,
  XCircle,
  CreditCard,
  Building,
  FileCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Modal, StatusBadge, EmptyState } from '../components/common/UIComponents';
import { formatINR } from '../utils/formatters';

export const Invoices = () => {
  const { invoices, customers, subscriptions, addInvoice, updateInvoice, recordPayment, globalSearch, user } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // Partial / Full Payment Dialog State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const effectiveSearch = globalSearch || searchTerm;

  const filteredInvoices = invoices.filter(inv => {
    if (user.role === 'Customer' && user.customerId && inv.customerId !== user.customerId) {
      return false;
    }
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(effectiveSearch.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleOpenPayModal = (inv) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.balanceDue);
    setIsPayModalOpen(true);
  };

  const handleExecutePayment = (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    recordPayment({
      invoiceId: selectedInvoice.id,
      invoiceNumber: selectedInvoice.invoiceNumber,
      customerId: selectedInvoice.customerId,
      customerName: selectedInvoice.customerName,
      amount: Number(paymentAmount),
      paymentMethod,
      notes: `Payment for ${selectedInvoice.invoiceNumber}`
    });

    setIsPayModalOpen(false);
    if (isInvoiceModalOpen) {
      const updated = invoices.find(i => i.id === selectedInvoice.id);
      setSelectedInvoice(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Invoices & Billing</h2>
          <p className="text-xs text-bright-textMuted mt-1">
            Automated recurring invoices, tax breakdowns, print-ready statements and payment tracking.
          </p>
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
            placeholder="Search invoices by invoice number or customer..."
            className="w-full pl-10 pr-4 py-2 bg-black/20 rounded-xl text-xs text-white border border-white/10 focus:outline-none focus:border-bright-violet"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['All', 'Paid', 'Partially Paid', 'Confirmed', 'Overdue', 'Draft'].map((st) => (
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

      {/* Invoices Table */}
      <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-bright-textMuted">
            <thead className="bg-black/30 text-white font-semibold uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-4 px-5">Invoice Number</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Billing Date</th>
                <th className="py-4 px-4">Due Date</th>
                <th className="py-4 px-4">Total</th>
                <th className="py-4 px-4">Balance Due</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8">
                    <EmptyState message="No invoices found in this view" />
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-5 font-mono text-white font-bold">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {inv.customerName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-bright-textMuted">
                      {inv.invoiceDate}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-bright-textMuted">
                      {inv.dueDate}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {formatINR(inv.total)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      {inv.balanceDue > 0 ? (
                        <span className="text-amber-400">{formatINR(inv.balanceDue)}</span>
                      ) : (
                        <span className="text-emerald-400">₹0.00 (Paid)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedInvoice(inv); setIsInvoiceModalOpen(true); }}
                          title="View & Print Invoice"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                        >
                          <Eye size={14} />
                        </button>
                        {inv.balanceDue > 0 && (
                          <button
                            onClick={() => handleOpenPayModal(inv)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow"
                          >
                            <CreditCard size={12} />
                            <span>Pay</span>
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

      {/* Full Detail Printable Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Tax Invoice"
        maxWidth="max-w-4xl"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            {/* Top Action Bar */}
            <div className="no-print flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs text-bright-textMuted">Official Enterprise Billing Statement</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bright-violet hover:bg-bright-violetHover text-white text-xs font-bold transition shadow-lg shadow-bright-violet/30"
                >
                  <Printer size={14} />
                  <span>Print / Save as PDF</span>
                </button>
                {selectedInvoice.balanceDue > 0 && (
                  <button
                    onClick={() => handleOpenPayModal(selectedInvoice)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    <CreditCard size={14} />
                    <span>Collect Payment</span>
                  </button>
                )}
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div className="print-area p-6 rounded-3xl bg-black/40 border border-white/10 text-white text-xs space-y-6">
              {/* Header with Company Logo & Invoice Meta */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="text-2xl font-black text-white flex items-center gap-1">
                    BRIGHT<span className="text-[#f2c400]">LOOP</span>
                  </div>
                  <div className="text-[11px] text-bright-textMuted mt-1">
                    Brightloop Cloud Technologies Pvt. Ltd.<br />
                    Tidel Park, ELCOT SEZ, Coimbatore, Tamil Nadu - 641014<br />
                    GSTIN: 33AABCU9603R1ZM
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-[#f2c400] font-mono">{selectedInvoice.invoiceNumber}</div>
                  <div className="mt-1 space-y-0.5 text-bright-textMuted">
                    <div>Date: <span className="text-white font-mono">{selectedInvoice.invoiceDate}</span></div>
                    <div>Due Date: <span className="text-white font-mono">{selectedInvoice.dueDate}</span></div>
                    <div>Status: <StatusBadge status={selectedInvoice.status} /></div>
                  </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-bright-textMuted block">Billed To (Client):</span>
                  <div className="text-sm font-bold text-white mt-1">{selectedInvoice.customerName}</div>
                  <div className="text-[11px] text-bright-textMuted mt-0.5">{selectedInvoice.customerEmail}</div>
                  <div className="text-[11px] text-bright-textMuted max-w-sm mt-0.5">{selectedInvoice.customerAddress}</div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-bright-textMuted block">Subscription Context:</span>
                  <div className="font-mono text-white text-xs mt-1">{selectedInvoice.subscriptionId}</div>
                  <div className="text-[11px] text-bright-textMuted mt-0.5">Cycle: {selectedInvoice.billingPeriod}</div>
                </div>
              </div>

              {/* Invoice Line Items */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-bright-textMuted uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5">Description</th>
                      <th className="py-2.5 text-center">Qty</th>
                      <th className="py-2.5 text-right">Unit Price</th>
                      <th className="py-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 text-white font-medium">{item.description}</td>
                        <td className="py-3 text-center text-bright-textMuted">{item.qty}</td>
                        <td className="py-3 text-right font-mono text-bright-textMuted">{formatINR(item.unitPrice)}</td>
                        <td className="py-3 text-right font-mono text-white font-bold">{formatINR(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Breakdown Totals */}
              <div className="flex justify-end pt-4 border-t border-white/10">
                <div className="w-72 space-y-2 text-xs">
                  <div className="flex justify-between text-bright-textMuted">
                    <span>Subtotal:</span>
                    <span className="font-mono text-white">{formatINR(selectedInvoice.subtotal)}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount:</span>
                      <span className="font-mono">-{formatINR(selectedInvoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-bright-textMuted">
                    <span>GST (18%):</span>
                    <span className="font-mono text-white">+{formatINR(selectedInvoice.tax)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold pt-2 border-t border-white/10 text-sm">
                    <span>Grand Total:</span>
                    <span className="font-mono text-[#f2c400]">{formatINR(selectedInvoice.total)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 pt-1">
                    <span>Amount Paid:</span>
                    <span className="font-mono">{formatINR(selectedInvoice.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-amber-400 font-bold pt-1 border-t border-dashed border-white/10">
                    <span>Balance Due:</span>
                    <span className="font-mono text-sm">{formatINR(selectedInvoice.balanceDue)}</span>
                  </div>
                </div>
              </div>

              {/* Terms & Bank details */}
              <div className="pt-4 border-t border-white/10 text-[10px] text-bright-textMuted space-y-1">
                <div>Terms & Instructions: Payment is due within standard subscription payment terms.</div>
                <div>Electronic bank transfer: Brightloop Cloud Tech | Indian Overseas Bank A/C: 20110034920194 | IFSC: IOBA0001234</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Payment Dialog */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Record Payment Receipt"
        maxWidth="max-w-md"
      >
        {selectedInvoice && (
          <form onSubmit={handleExecutePayment} className="space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-black/30 border border-white/10 space-y-1">
              <div className="text-white font-bold">{selectedInvoice.invoiceNumber}</div>
              <div className="text-bright-textMuted">Customer: {selectedInvoice.customerName}</div>
              <div className="text-amber-400 font-bold">Outstanding Balance: {formatINR(selectedInvoice.balanceDue)}</div>
            </div>

            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Payment Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                max={selectedInvoice.balanceDue}
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet font-mono text-sm"
              />
              <span className="text-[10px] text-bright-textMuted mt-1 block">
                Enter full or partial payment amount. Invoice will auto-update to Partially Paid or Paid.
              </span>
            </div>

            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              >
                <option value="UPI" className="bg-[#241733]">UPI / QR</option>
                <option value="Bank Transfer" className="bg-[#241733]">Bank Transfer (NEFT / RTGS)</option>
                <option value="Card" className="bg-[#241733]">Credit / Debit Card</option>
                <option value="Cash" className="bg-[#241733]">Cash</option>
                <option value="Other" className="bg-[#241733]">Other</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
