"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuArrowLeft, LuPackage, LuSearch, LuPlus, LuPencil, LuTrash2, LuX } from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/utils/useApi";

interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  categoryId?: string;
  category?: { id: string; name: string };
  image?: string;
  status?: string;
  sku?: string;
  taxRate?: number;
  inventory?: { stock: number; minimumStock: number };
}

interface Category {
  id: string;
  name: string;
  color?: string;
}

export default function ProductsPage() {
  const { role } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", price: "", costPrice: "", categoryId: "", sku: "", stock: "", minimumStock: "", taxRate: "5", status: "Available", image: "☕" });

  const loadData = async () => {
    setLoading(true);
    const res = await apiFetch("/products");
    if (res.success && res.data) {
      setProducts(res.data.products || []);
      setCategories(res.data.categories || []);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = products.filter(
    (p) =>
      (activeCategory === "all" || p.categoryId === activeCategory) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ name: "", price: "", costPrice: "", categoryId: "", sku: "", stock: "100", minimumStock: "20", taxRate: "5", status: "Available", image: "☕" });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      price: p.price.toString(),
      costPrice: (p.costPrice || 0).toString(),
      categoryId: p.categoryId || "",
      sku: p.sku || "",
      stock: (p.inventory?.stock || 100).toString(),
      minimumStock: (p.inventory?.minimumStock || 20).toString(),
      taxRate: (p.taxRate || 5).toString(),
      status: p.status || "Available",
      image: p.image || "☕",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      costPrice: parseFloat(form.costPrice) || 0,
      categoryId: form.categoryId || null,
      sku: form.sku,
      taxRate: parseFloat(form.taxRate) || 5,
      status: form.status,
      image: form.image,
      stock: parseInt(form.stock) || 100,
      minimumStock: parseInt(form.minimumStock) || 20,
    };

    const res = editingProduct
      ? await apiPut(`/products/${editingProduct.id}`, payload)
      : await apiPost("/products", payload);
    if (res.success) {
      setShowModal(false);
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const res = await apiDelete(`/products/${id}`);
    if (res.success) loadData();
  };

  const getStockInfo = (p: Product) => {
    const stock = p.inventory?.stock ?? 0;
    const min = p.inventory?.minimumStock ?? 0;
    if (stock === 0) return { label: "Out of Stock", class: "bg-red-500/15 text-red-400" };
    if (stock <= min) return { label: `Low (${stock})`, class: "bg-amber-500/15 text-amber-400" };
    return { label: `${stock} in stock`, class: "bg-brand-500/15 text-brand-400" };
  };

  if (role === 'EMPLOYEE') return <div className="min-h-screen bg-cafe-bg flex items-center justify-center"><p className="text-cafe-text-secondary">Access restricted to Admin</p></div>;

  return (
    <div className="min-h-screen bg-cafe-bg">
      <header className="flex items-center gap-4 border-b border-cafe-border px-4 lg:px-6 py-4 bg-cafe-cream/40">
        <Link href="/dashboard" className="rounded-btn p-2 text-cafe-text-secondary hover:text-cafe-accent"><LuArrowLeft className="h-5 w-5" /></Link>
        <div className="flex items-center gap-2"><LuPackage className="h-5 w-5 text-cafe-accent" /><h1 className="text-lg text-cafe-text">Products</h1></div>
        <button onClick={openCreate} className="btn-primary ml-auto flex items-center gap-2 text-sm"><LuPlus className="h-4 w-4" />Add Product</button>
      </header>

      <div className="p-4 lg:p-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-cafe-cream/60 p-1">
            {[{ id: "all", name: "All" }, ...categories].map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${activeCategory === cat.id ? "bg-cafe-accent/10 text-cafe-accent" : "text-cafe-text-secondary hover:text-cafe-text"}`}>
                {cat.name}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <LuSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cafe-text-secondary/50" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 py-2 text-sm" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-cafe-text-secondary">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product) => {
              const stock = getStockInfo(product);
              return (
                <div key={product.id} className="glass-card p-5 group">
                  <div className="mb-3 flex items-start justify-between">
                    <span className="text-4xl">{product.image || "☕"}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stock.class}`}>{stock.label}</span>
                  </div>
                  <h3 className="text-base font-semibold text-cafe-text">{product.name}</h3>
                  <p className="mt-1 text-xs text-cafe-text-secondary">{product.category?.name || "Uncategorized"}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-lg font-bold text-cafe-accent">₹{product.price.toFixed(2)}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(product)} className="rounded-lg bg-cafe-cream/60 p-1.5 text-cafe-text-secondary hover:text-cafe-accent"><LuPencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(product.id)} className="rounded-lg bg-cafe-cream/60 p-1.5 text-cafe-text-secondary hover:text-red-400"><LuTrash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-cafe-bg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg text-cafe-text">{editingProduct ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-cafe-text-secondary hover:text-cafe-accent"><LuX className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Product name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input-field">
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Price (₹)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Cost Price</label>
                  <input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="input-field" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">SKU</label>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input-field" placeholder="SKU-0001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Tax Rate (%)</label>
                  <input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Min Stock</label>
                  <input type="number" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} className="btn-primary">{editingProduct ? "Update" : "Create"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
