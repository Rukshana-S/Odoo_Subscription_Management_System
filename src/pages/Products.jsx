import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package, Tag, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Modal, ConfirmDialog, EmptyState } from '../components/common/UIComponents';

export const Products = () => {
  const { products, addProduct, updateProduct, deleteProduct, globalSearch } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Form State with support for dynamic variants (e.g. Standard: ₹0, Odoo Brand: +₹560)
  const [form, setForm] = useState({
    name: '',
    type: 'Software',
    salesPrice: 1000,
    costPrice: 450,
    notes: '',
    variants: [
      { name: 'Standard', additionalPrice: 0, finalPrice: 1000 },
      { name: 'Odoo Brand Edition', additionalPrice: 560, finalPrice: 1560 }
    ]
  });

  const effectiveSearch = globalSearch || searchTerm;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
    p.type.toLowerCase().includes(effectiveSearch.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      type: 'Software',
      salesPrice: 1000,
      costPrice: 400,
      notes: '',
      variants: [
        { name: 'Standard', additionalPrice: 0, finalPrice: 1000 },
        { name: 'Odoo Brand Edition', additionalPrice: 560, finalPrice: 1560 }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      type: p.type,
      salesPrice: p.salesPrice,
      costPrice: p.costPrice,
      notes: p.notes,
      variants: p.variants || [{ name: 'Standard', additionalPrice: 0, finalPrice: p.salesPrice }]
    });
    setIsModalOpen(true);
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...form.variants];
    const basePrice = Number(form.salesPrice) || 0;

    if (field === 'additionalPrice') {
      const addPrice = Number(value) || 0;
      updated[index] = {
        ...updated[index],
        additionalPrice: addPrice,
        finalPrice: basePrice + addPrice
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setForm({ ...form, variants: updated });
  };

  const handleBasePriceChange = (val) => {
    const basePrice = Number(val) || 0;
    const updatedVariants = (form.variants || []).map(v => ({
      ...v,
      finalPrice: basePrice + Number(v.additionalPrice || 0)
    }));
    setForm({ ...form, salesPrice: basePrice, variants: updatedVariants });
  };

  const addVariantRow = () => {
    const basePrice = Number(form.salesPrice) || 0;
    setForm({
      ...form,
      variants: [
        ...form.variants,
        { name: `Tier ${form.variants.length + 1}`, additionalPrice: 200, finalPrice: basePrice + 200 }
      ]
    });
  };

  const removeVariantRow = (index) => {
    if (form.variants.length <= 1) return;
    setForm({
      ...form,
      variants: form.variants.filter((_, i) => i !== index)
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, form);
    } else {
      addProduct(form);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteProduct(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Products & Software Catalog</h2>
          <p className="text-xs text-bright-textMuted mt-1">
            Configure enterprise software products, tiered variants, and cost margins.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8524E5] hover:bg-[#7022B9] text-white text-xs font-bold transition shadow-lg shadow-[#8524E5]/30 active:scale-95"
        >
          <Plus size={16} />
          <span>Add Product</span>
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
            placeholder="Search products by title or category..."
            className="w-full pl-10 pr-4 py-2 bg-black/20 rounded-xl text-xs text-white border border-white/10 focus:outline-none focus:border-bright-violet"
          />
        </div>
      </div>

      {/* Products Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              message="No products found"
              actionText="Add New Product"
              onAction={handleOpenAdd}
            />
          </div>
        ) : (
          filteredProducts.map((p) => {
            const margin = Math.round(((p.salesPrice - p.costPrice) / p.salesPrice) * 100);
            return (
              <div
                key={p.id}
                className="glass-card rounded-3xl p-5 border border-white/10 hover:border-bright-violet/40 transition-all flex flex-col justify-between shadow-xl group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-bright-violet/20 text-[#d494ff] border border-bright-violet/30">
                      {p.type}
                    </span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                        title="Edit Product"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(p.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                        title="Delete Product"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{p.name}</h3>
                  <p className="text-xs text-bright-textMuted mt-1 line-clamp-2">{p.notes || "Enterprise ready module."}</p>

                  <div className="mt-4 p-3 rounded-2xl bg-black/25 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-bright-textMuted block uppercase">Base Price</span>
                      <span className="text-lg font-black text-white">₹{p.salesPrice.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-bright-textMuted block uppercase">Gross Margin</span>
                      <span className="text-xs font-bold text-emerald-400">{margin}% (Cost ₹{p.costPrice})</span>
                    </div>
                  </div>

                  {/* Variants Section with Auto-Calculated Final Price */}
                  <div className="mt-4">
                    <div className="text-[11px] font-semibold text-bright-textMuted mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1"><Layers size={12} /> Product Variants</span>
                      <span className="text-[10px] text-bright-yellow">{p.variants?.length || 1} available</span>
                    </div>
                    <div className="space-y-1.5">
                      {p.variants?.map((v, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs"
                        >
                          <span className="text-white/90 font-medium">{v.name}</span>
                          <span className="font-bold text-[#f2c400] font-mono">
                            ₹{v.finalPrice ? v.finalPrice.toLocaleString() : (p.salesPrice + (v.additionalPrice || 0)).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 text-[10px] text-bright-textMuted flex items-center justify-between">
                  <span>Code: {p.id}</span>
                  <span className="text-emerald-400 font-semibold">Active Catalog</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Product Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Product Specifications" : "Create Product with Variants"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-bright-textMuted mb-1 font-medium">Product / Service Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              placeholder="e.g. Business Software Suite"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Product Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              >
                <option value="Software" className="bg-[#241733]">Software</option>
                <option value="Service" className="bg-[#241733]">Service</option>
                <option value="Infrastructure" className="bg-[#241733]">Infrastructure</option>
              </select>
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Base Sales Price (₹)</label>
              <input
                type="number"
                required
                min="0"
                value={form.salesPrice}
                onChange={(e) => handleBasePriceChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
            <div>
              <label className="block text-bright-textMuted mb-1 font-medium">Cost Price (₹)</label>
              <input
                type="number"
                required
                min="0"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              />
            </div>
          </div>

          {/* Dynamic Variants Builder (Auto Calculation Requirement) */}
          <div className="p-3.5 rounded-2xl bg-black/25 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Product Variants & Price Additions</span>
                <span className="text-[11px] text-bright-textMuted">Final price will auto-calculate: Base + Additional</span>
              </div>
              <button
                type="button"
                onClick={addVariantRow}
                className="px-2.5 py-1 rounded-lg bg-bright-violet/30 hover:bg-bright-violet text-white text-[11px] font-semibold transition"
              >
                + Add Variant
              </button>
            </div>

            <div className="space-y-2">
              {form.variants.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={v.name}
                    placeholder="Variant name (e.g. Odoo Brand)"
                    onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white"
                    required
                  />
                  <div className="w-28 relative">
                    <span className="absolute left-2.5 top-1.5 text-bright-textMuted">+₹</span>
                    <input
                      type="number"
                      value={v.additionalPrice}
                      onChange={(e) => handleVariantChange(idx, 'additionalPrice', e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white"
                      placeholder="Addon"
                    />
                  </div>
                  <div className="w-32 py-1.5 px-3 rounded-xl bg-white/10 text-[#f2c400] font-bold text-right font-mono">
                    = ₹{v.finalPrice}
                  </div>
                  {form.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariantRow(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-bright-textMuted mb-1 font-medium">Description / Release Notes</label>
            <textarea
              rows="2"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              placeholder="Features, licensing notes and technical requirements"
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
              {editingProduct ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message="Are you sure you want to remove this product? It will no longer be selectable in subscriptions."
        confirmText="Remove Product"
        isDanger={true}
      />
    </div>
  );
};

