import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Repeat,
  Receipt,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { StatusBadge } from '../components/common/UIComponents';
import { formatINR } from '../utils/formatters';

export const CustomerPortal = () => {
  const navigate = useNavigate();
  const { user, subscriptions, invoices, payments } = useData();

  // Find customer information corresponding to logged-in user (Kavin, Nila, Arjun, Yazhini, Harish)
  const customerId = user.customerId || 'CUST-001';
  const mySubscriptions = subscriptions.filter(s => s.customerId === customerId);
  const myInvoices = invoices.filter(i => i.customerId === customerId);
  const myPayments = payments.filter(p => p.customerId === customerId);

  const pendingDues = myInvoices
    .filter(i => i.status !== 'Paid' && i.status !== 'Cancelled')
    .reduce((acc, i) => acc + Number(i.balanceDue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#8524E5]/30 text-white border border-[#8524E5]/40 mb-2 inline-block">
              Client Portal Account
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome, {user.name}
            </h2>
            <p className="text-xs text-bright-textMuted mt-1">
              View your subscriptions, settle pending invoices, and review payment receipts.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-right">
            <span className="text-[10px] uppercase font-bold text-bright-textMuted block">Pending Balance</span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
              {formatINR(pendingDues)}
            </div>
            {pendingDues > 0 ? (
              <button
                onClick={() => navigate('/invoices')}
                className="mt-2 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow transition"
              >
                Pay Pending Invoices
              </button>
            ) : (
              <span className="text-[10px] text-emerald-400 font-bold block mt-1">All Dues Cleared</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Subscriptions & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Subscriptions Card */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Repeat size={18} className="text-bright-violet" />
              <span>My Subscriptions ({mySubscriptions.length})</span>
            </h3>
            <button
              onClick={() => navigate('/subscriptions')}
              className="text-xs text-bright-violet hover:text-white flex items-center gap-1"
            >
              View all <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {mySubscriptions.length === 0 ? (
              <div className="text-xs text-bright-textMuted py-4 text-center">No active subscriptions assigned.</div>
            ) : (
              mySubscriptions.map(s => (
                <div key={s.id} className="p-3.5 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">{s.planName}</div>
                    <div className="text-[10px] text-bright-textMuted mt-0.5">
                      Cycle: {s.billingInterval} • Next: {s.nextBillingDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-[#f2c400]">{formatINR(s.totalAmount)}</div>
                    <div className="mt-1"><StatusBadge status={s.status} /></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Invoices Card */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt size={18} className="text-[#f2c400]" />
              <span>My Invoices ({myInvoices.length})</span>
            </h3>
            <button
              onClick={() => navigate('/invoices')}
              className="text-xs text-bright-violet hover:text-white flex items-center gap-1"
            >
              View all <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {myInvoices.length === 0 ? (
              <div className="text-xs text-bright-textMuted py-4 text-center">No invoices issued.</div>
            ) : (
              myInvoices.map(inv => (
                <div key={inv.id} className="p-3.5 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold font-mono text-white">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-bright-textMuted mt-0.5">Due: {inv.dueDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-white">{formatINR(inv.total)}</div>
                    <div className="mt-1"><StatusBadge status={inv.status} /></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Payment History Strip */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl">
        <h3 className="text-base font-bold text-white mb-3">Recent Payment Receipts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-bright-textMuted">
            <thead className="border-b border-white/10 text-white text-[10px] uppercase font-bold">
              <tr>
                <th className="py-2.5">Receipt Ref</th>
                <th className="py-2.5">Invoice</th>
                <th className="py-2.5">Channel</th>
                <th className="py-2.5">Amount</th>
                <th className="py-2.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {myPayments.map(p => (
                <tr key={p.id}>
                  <td className="py-2.5 font-mono text-white font-bold">{p.id}</td>
                  <td className="py-2.5 font-mono text-bright-violet">{p.invoiceNumber}</td>
                  <td className="py-2.5 text-white">{p.paymentMethod}</td>
                  <td className="py-2.5 font-mono font-bold text-emerald-400">{formatINR(p.amount)}</td>
                  <td className="py-2.5 font-mono">{p.paymentDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
