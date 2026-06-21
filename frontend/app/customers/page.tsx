"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuArrowLeft, LuUsers, LuSearch, LuPlus, LuPencil, LuTrash2, LuX, LuStar, LuPhone, LuMail } from "react-icons/lu";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/utils/useApi";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  loyalty: number;
  totalSpent: number;
  visitCount: number;
  address?: string;
  birthday?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", birthday: "" });

  const load = async () => {
    setLoading(true);
    const res = await apiFetch("/customers");
    if (res.success && res.data) setCustomers(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", address: "", birthday: "" });
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email || "", phone: c.phone || "", address: c.address || "", birthday: c.birthday || "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    const payload = { ...form, birthday: form.birthday || null };
    const res = editing ? await apiPut(`/customers/${editing.id}`, payload) : await apiPost("/customers", payload);
    if (res.success) { setShowModal(false); load(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    const res = await apiDelete(`/customers/${id}`);
    if (res.success) load();
  };

  return (
    <div className="min-h-screen bg-cafe-bg">
      <header className="flex items-center gap-4 border-b border-cafe-border px-4 lg:px-6 py-4 bg-cafe-cream/40">
        <Link href="/dashboard" className="rounded-btn p-2 text-cafe-text-secondary hover:text-cafe-accent"><LuArrowLeft className="h-5 w-5" /></Link>
        <div className="flex items-center gap-2"><LuUsers className="h-5 w-5 text-cafe-accent" /><h1 className="text-lg text-cafe-text">Customers</h1></div>
        <button onClick={openCreate} className="btn-primary ml-auto flex items-center gap-2 text-sm"><LuPlus className="h-4 w-4" />Add Customer</button>
      </header>

      <div className="p-4 lg:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <LuSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cafe-text-secondary/50" />
            <input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <span className="text-sm text-cafe-text-secondary">{filtered.length} customers</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-cafe-text-secondary">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((customer) => (
              <div key={customer.id} className="glass-card p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cafe-accent/10 text-sm font-bold text-cafe-accent">
                    {customer.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-cafe-text">{customer.name}</h3>
                    {customer.email && <p className="truncate text-xs text-cafe-text-secondary">{customer.email}</p>}
                    {customer.phone && <p className="truncate text-xs text-cafe-text-secondary">{customer.phone}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cafe-text-secondary">Loyalty</span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-amber-400">
                      <LuStar className="h-3.5 w-3.5" />{customer.loyalty || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cafe-text-secondary">Total Spent</span>
                    <span className="text-sm font-semibold text-cafe-accent">₹{(customer.totalSpent || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cafe-text-secondary">Visits</span>
                    <span className="text-sm font-medium text-cafe-text">{customer.visitCount || 0}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEdit(customer)} className="flex-1 rounded-btn bg-cafe-cream/60 py-2 text-xs font-medium text-cafe-text-secondary hover:text-cafe-accent transition-colors">
                    <LuPencil className="h-3.5 w-3.5 inline mr-1" />Edit
                  </button>
                  <button onClick={() => handleDelete(customer.id)} className="rounded-btn bg-cafe-cream/60 p-2 text-cafe-text-secondary hover:text-red-400 transition-colors">
                    <LuTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-cafe-bg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg text-cafe-text">{editing ? "Edit Customer" : "Add Customer"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-cafe-text-secondary hover:text-cafe-accent"><LuX className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Customer name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+91 9876543210" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Address</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Birthday</label>
                <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className="input-field" />
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
