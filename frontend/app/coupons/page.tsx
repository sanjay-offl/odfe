"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuArrowLeft, LuTicket, LuPlus, LuX, LuTag, LuClock, LuPencil, LuTrash2 } from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/utils/useApi";

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
}

export default function CouponsPage() {
  const { role } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ code: "", discountType: "percentage", discountValue: "", validUntil: "" });

  const load = async () => {
    setLoading(true);
    const res = await apiFetch("/coupons");
    if (res.success && res.data) setCoupons(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", discountType: "percentage", discountValue: "", validUntil: "" });
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue.toString(),
      validUntil: c.validUntil ? c.validUntil.slice(0, 10) : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discountValue) return;
    const payload = {
      code: form.code.toUpperCase(),
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
    };
    const res = editing ? await apiPut(`/coupons/${editing.id}`, payload) : await apiPost("/coupons", payload);
    if (res.success) { setShowModal(false); load(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    const res = await apiDelete(`/coupons/${id}`);
    if (res.success) load();
  };

  if (role === 'EMPLOYEE') return <div className="min-h-screen bg-cafe-bg flex items-center justify-center"><p className="text-cafe-text-secondary">Access restricted</p></div>;

  return (
    <div className="min-h-screen bg-cafe-bg">
      <header className="flex items-center gap-4 border-b border-cafe-border px-4 lg:px-6 py-4 bg-cafe-cream/40">
        <Link href="/dashboard" className="rounded-btn p-2 text-cafe-text-secondary hover:text-cafe-accent"><LuArrowLeft className="h-5 w-5" /></Link>
        <div className="flex items-center gap-2"><LuTicket className="h-5 w-5 text-cafe-accent" /><h1 className="text-lg text-cafe-text">Coupons</h1></div>
        <button onClick={openCreate} className="btn-primary ml-auto flex items-center gap-2 text-sm"><LuPlus className="h-4 w-4" />Create Coupon</button>
      </header>

      <div className="p-4 lg:p-6">
        {loading ? (
          <div className="text-center py-12 text-cafe-text-secondary">Loading...</div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 text-cafe-text-secondary">No coupons found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="glass-card p-5 group">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-accent/10">
                    <LuTag className="h-5 w-5 text-cafe-accent" />
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${coupon.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-500/15 text-gray-400"}`}>
                    {coupon.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3 className="font-mono text-lg font-bold tracking-wider text-cafe-text">{coupon.code}</h3>
                <p className="mt-1 text-2xl font-bold text-cafe-accent">
                  {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                  <span className="ml-1 text-xs text-cafe-text-secondary">off</span>
                </p>
                {coupon.validUntil && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-cafe-text-secondary">
                    <LuClock className="h-3.5 w-3.5" />
                    Expires {new Date(coupon.validUntil).toLocaleDateString()}
                  </div>
                )}
                <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(coupon)} className="flex-1 rounded-btn bg-cafe-cream/60 py-1.5 text-xs text-cafe-text-secondary hover:text-cafe-accent"><LuPencil className="h-3 w-3 inline mr-1" />Edit</button>
                  <button onClick={() => handleDelete(coupon.id)} className="rounded-btn bg-cafe-cream/60 p-1.5 text-cafe-text-secondary hover:text-red-400"><LuTrash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-cafe-bg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg text-cafe-text">{editing ? "Edit Coupon" : "Create Coupon"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-cafe-text-secondary hover:text-cafe-accent"><LuX className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Code *</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input-field uppercase" placeholder="WELCOME10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Type</label>
                  <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="input-field">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Value *</label>
                  <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="input-field" placeholder="10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Valid Until</label>
                <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} className="btn-primary">{editing ? "Update" : "Create"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
