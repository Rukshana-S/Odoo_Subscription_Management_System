import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'paid':
      case 'accepted':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'partially paid':
      case 'sent':
      case 'due soon':
      case 'pending':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'draft':
      case 'inactive':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 'paused':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'overdue':
      case 'expired':
      case 'rejected':
      case 'closed':
      case 'cancelled':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle(status)}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75"></span>
      {status || 'Unknown'}
    </span>
  );
};

export const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className={`w-full ${maxWidth} bg-[#281c38] border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <h3 className="text-xl font-bold text-white tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ConfirmDialog = ({ isOpen, onCancel, onConfirm, title, message, confirmText = "Confirm", isDanger = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#2c1d3f] border border-white/10 rounded-2xl p-6 shadow-2xl text-center">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-bright-textMuted mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white text-sm font-medium transition ${
              isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-bright-violet hover:bg-bright-violetHover'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = "violet" }) => {
  return (
    <div className="glass-card rounded-2xl p-5 border border-white/10 hover:border-bright-violet/40 transition duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-bright-textMuted">{title}</span>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[#8524E5]/20 text-[#c77dff] flex items-center justify-center">
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="text-2xl font-extrabold text-white tracking-tight mb-1">{value}</div>
      {(subtitle || trend) && (
        <div className="flex items-center gap-2 text-xs text-bright-textMuted">
          {trend && (
            <span className={trend.startsWith('+') ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {trend}
            </span>
          )}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};

export const EmptyState = ({ message, subtext, actionText, onAction }) => {
  return (
    <div className="text-center py-12 px-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
      <div className="w-12 h-12 mx-auto rounded-full bg-bright-violet/20 flex items-center justify-center text-bright-violet mb-3">
        🔍
      </div>
      <h4 className="text-base font-medium text-white mb-1">{message || "No records found"}</h4>
      <p className="text-xs text-bright-textMuted max-w-sm mx-auto mb-4">
        {subtext || "Try adjusting your search criteria or create a new entry to get started."}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-bright-violet hover:bg-bright-violetHover text-white text-xs font-medium rounded-xl transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

