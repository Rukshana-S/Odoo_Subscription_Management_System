import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Mail, Phone, Building, Calendar, Eye, Filter } from 'lucide-react';
import { useData } from '../context/DataContext';
import { StatusBadge, Modal, ConfirmDialog, EmptyState } from '../components/common/UIComponents';

export const Customers = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, globalSearch } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    status: 'Active'
  });

  const effectiveSearch = globalSearch || searchTerm;

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      c.company.toLowerCase().includes(effectiveSearch.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      address: customer.address,
      status: customer.status
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, form);
    } else {
      addCustomer(form);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteCustomer(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Customer Management</h2>
          <p className="text-xs text-bright-textMuted mt-1">
            Manage customer directories, contact profiles, and subscription assignments.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8524E5] hover:bg-[#7022B9] text-white text-xs font-bold transition shadow-lg shadow-[#8524E5]/30 active:scale-95"
        >
          <Plus size={16} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 glass-card p-3 rounded-2xl border border-white/5">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-3 text-bright-textMuted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email or company..."
            className="w-full pl-10 pr-4 py-2 bg-black/20 rounded-xl text-xs text-white border border-white/10 focus:outline-none focus:border-bright-violet"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-bright-textMuted hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-black/20 rounded-xl text-xs text-white border border-white/10 focus:outline-none focus:border-bright-violet"
          >
            <option value="All" className="bg-[#241733]">All Statuses</option>
            <option value="Active" className="bg-[#241733]">Active</option>
            <option value="Inactive" className="bg-[#241733]">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-bright-textMuted">
            <thead className="bg-black/30 text-white font-semibold uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-4 px-5">Customer</th>
                <th className="py-4 px-4">Contact Info</th>
                <th className="py-4 px-4">Company</th>
                <th className="py-4 px-4">Registered</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8">
                    <EmptyState
                      message="No customers matched your filter"
                      actionText="Create Customer"
                      onAction={handleOpenAdd}
                    />
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-[#8524E5]/40"
                        />
                        <div>
                          <div className="font-bold text-white text-xs">{c.name}</div>
                          <div className="text-[10px] text-bright-textMuted font-mono">{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 text-white/90">
                          <Mail size={12} className="text-bright-violet" /> {c.email}
                        </span>
                        <span className="flex items-center gap-1.5 text-bright-textMuted text-[11px]">
                          <Phone size={12} /> {c.phone}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-white">
                      <div className="flex items-center gap-1.5">
                        <Building size={13} className="text-bright-textMuted" />
                        <span>{c.company}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-bright-textMuted">
                      {c.registrationDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setViewCustomer(c); setIsViewModalOpen(true); }}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-bright-textMuted hover:text-white transition"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Edit"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-bright-textMuted hover:text-white transition"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(c.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? "Edit Customer Profile" : "Register New Customer"}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-bright-textMuted mb-1 font-medium">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              placeholder="e.g. Kavin"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
                placeholder="name@chennaitech.in"
              />
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Phone Number</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
                placeholder="+91 98401 23456"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Company Name</label>
              <input
                type="text"
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
                placeholder="Enterprise Pvt Ltd"
              />
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              >
                <option value="Active" className="bg-[#241733]">Active</option>
                <option value="Inactive" className="bg-[#241733]">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-bright-textMuted mb-1 font-medium">Billing & Registered Address</label>
            <textarea
              rows="3"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              placeholder="Full office address in Tamil Nadu"
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
              {editingCustomer ? "Update Customer" : "Save Customer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Customer Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Customer Profile Dossier"
      >
        {viewCustomer && (
          <div className="space-y-5 text-xs">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/30 border border-white/10">
              <img
                src={viewCustomer.avatar}
                alt={viewCustomer.name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-[#8524E5]"
              />
              <div>
                <h4 className="text-lg font-bold text-white">{viewCustomer.name}</h4>
                <div className="text-bright-violet font-semibold">{viewCustomer.company}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-bright-textMuted font-mono">ID: {viewCustomer.id}</span>
                  <StatusBadge status={viewCustomer.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] uppercase text-bright-textMuted block font-bold">Email Address</span>
                <span className="text-white font-medium text-xs mt-0.5 block">{viewCustomer.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] uppercase text-bright-textMuted block font-bold">Phone Number</span>
                <span className="text-white font-medium text-xs mt-0.5 block">{viewCustomer.phone}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] uppercase text-bright-textMuted block font-bold">Registered Office Address</span>
              <p className="text-white/90 text-xs mt-1 leading-relaxed">{viewCustomer.address}</p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] uppercase text-bright-textMuted block font-bold">Member Since</span>
              <span className="text-white font-mono text-xs mt-1 block">{viewCustomer.registrationDate}</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-bright-violet text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer Account"
        message="Are you sure you want to permanently delete this customer? All historical records will be detached."
        confirmText="Delete Customer"
        isDanger={true}
      />
    </div>
  );
};
