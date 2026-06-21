"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuArrowLeft, LuShoppingBag, LuSearch, LuPlus, LuMinus, LuTrash2, LuX, LuQrCode, LuClock } from "react-icons/lu";
import { apiFetch, apiPost } from "@/utils/useApi";
import { supabase } from "@/utils/supabaseClient";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  category?: { id: string; name: string; color?: string };
  image?: string;
  description?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function SelfOrderPage() {
  const [categories, setCategories] = useState<any[]>([{ id: "all", name: "All", color: "#6F4E37" }]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderTracking, setOrderTracking] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const loadData = async () => {
    try {
      const res = await apiFetch("/products");
      if (res.success && res.data) {
        setCategories([{ id: "all", name: "All", color: "#6F4E37" }, ...(res.data.categories || [])]);
        setItems((res.data.products || []).map((p: any) => ({ ...p, description: p.description || `${p.category?.name || ''} item` })));
      }
    } catch (error) {
      console.error("Failed to load menu", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = items.filter(
    (item) =>
      (activeCategory === "all" || item.categoryId === activeCategory) &&
      item.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, image: item.image }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter((c) => c.quantity > 0));
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.id !== id));

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percentage") discountAmount = subtotal * (appliedCoupon.discountValue / 100);
    else discountAmount = appliedCoupon.discountValue;
  }
  discountAmount = Math.min(discountAmount, subtotal);
  const tax = (subtotal - discountAmount) * 0.08;
  const total = subtotal - discountAmount + tax;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((c) => ({ productId: c.id, quantity: c.quantity, price: c.price })),
        subtotal,
        tax,
        discount: discountAmount,
        total,
        paymentMethod: "CASH",
        status: "QUEUED",
      };
      const res = await apiPost("/orders", payload);
      if (res.success) {
        setOrderTracking({ orderNo: res.data?.orderNo || "ORD-0000", status: "QUEUED" });
        setCart([]);
        setAppliedCoupon(null);
      } else {
        alert(res.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Order failed:", error);
      alert("Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    const res = await apiFetch("/coupons");
    if (res.success && res.data) {
      const coupon = res.data.find((c: any) => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive);
      if (coupon) setAppliedCoupon(coupon);
      else alert("Invalid coupon");
    }
  };

  if (orderTracking) {
    return (
      <div className="min-h-screen bg-cafe-bg flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-cafe-accent/10">
            <LuShoppingBag className="h-10 w-10 text-cafe-accent" />
          </div>
          <h2 className="text-2xl font-bold text-cafe-text font-display mb-2">Order Placed!</h2>
          <p className="text-cafe-accent text-lg font-semibold mb-6">#{orderTracking.orderNo}</p>
          <div className="glass-panel p-6 mb-6">
            <div className="flex items-center gap-3 justify-center">
              <LuClock className="h-5 w-5 text-cafe-accent animate-pulse" />
              <span className="text-cafe-text-secondary">Your order is being prepared</span>
            </div>
          </div>
          <button onClick={() => { setOrderTracking(null); loadData(); }}
            className="btn-primary">Order Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cafe-bg">
      <header className="flex items-center gap-4 border-b border-cafe-border px-4 lg:px-6 py-4 bg-cafe-cream/40">
        <Link href="/dashboard" className="rounded-btn p-2 text-cafe-text-secondary hover:text-cafe-accent"><LuArrowLeft className="h-5 w-5" /></Link>
        <div className="flex items-center gap-2"><LuQrCode className="h-5 w-5 text-cafe-accent" /><h1 className="text-lg text-cafe-text">Self-Order</h1></div>
        <button onClick={() => setShowCart(!showCart)}
          className="relative ml-auto rounded-btn bg-cafe-cream/60 p-2.5 text-cafe-text-secondary hover:text-cafe-accent">
          <LuShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cafe-accent text-[10px] font-bold text-white">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      <div className="px-4 lg:px-6 pt-6">
        <div className="relative mb-4">
          <LuSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cafe-text-secondary/50" />
          <input type="text" placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 lg:px-6 pb-3">
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-btn px-4 py-2 text-sm font-medium transition-all ${activeCategory === cat.id ? "bg-cafe-accent/10 text-cafe-accent" : "text-cafe-text-secondary hover:bg-cafe-cream/60"}`}>
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-cafe-text-secondary">Loading menu...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 lg:p-6">
          {filtered.map((item) => (
            <button key={item.id} onClick={() => addToCart(item)}
              className="glass-card flex flex-col items-center p-4 lg:p-5 text-center hover:border-cafe-accent/30 transition-all active:scale-95">
              <span className="mb-3 text-4xl">{item.image || "☕"}</span>
              <h3 className="text-sm font-semibold text-cafe-text">{item.name}</h3>
              {item.description && <p className="mt-1 text-xs text-cafe-text-secondary line-clamp-1">{item.description}</p>}
              <p className="mt-2 text-base font-bold text-cafe-accent">₹{item.price.toFixed(2)}</p>
            </button>
          ))}
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-cafe-bg p-6 shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-cafe-text">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="text-cafe-text-secondary hover:text-cafe-accent"><LuX className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="py-12 text-center text-cafe-text-secondary">Cart is empty</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-btn border border-cafe-border bg-cafe-cream/30 p-3">
                      <span className="text-xl">{item.image || "☕"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-cafe-text truncate">{item.name}</p>
                        <p className="text-xs text-cafe-accent">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => updateQuantity(item.id, -1)} className="rounded-lg bg-cafe-cream/60 p-1 text-cafe-text-secondary hover:text-cafe-accent"><LuMinus className="h-3.5 w-3.5" /></button>
                        <span className="w-6 text-center text-sm font-medium text-cafe-text">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="rounded-lg bg-cafe-cream/60 p-1 text-cafe-text-secondary hover:text-cafe-accent"><LuPlus className="h-3.5 w-3.5" /></button>
                        <button onClick={() => removeFromCart(item.id)} className="ml-1 rounded-lg p-1 text-red-400/60 hover:bg-red-500/10 hover:text-red-400"><LuTrash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="mt-4 border-t border-cafe-border pt-4 space-y-3">
                <div className="flex gap-2">
                  <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code" className="input-field flex-1 text-sm" />
                  <button onClick={handleApplyCoupon} className="btn-secondary text-sm">Apply</button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center gap-1 text-xs text-emerald-400">
                    <span>{appliedCoupon.code} ({appliedCoupon.discountType === "percentage" ? `${appliedCoupon.discountValue}%` : `₹${appliedCoupon.discountValue}`} off)</span>
                    <button onClick={() => setAppliedCoupon(null)} className="ml-auto"><LuX className="h-3 w-3" /></button>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-cafe-text">
                  <span>Total</span>
                  <span className="text-cafe-accent">₹{total.toFixed(2)}</span>
                </div>
                <button onClick={handlePlaceOrder} disabled={submitting} className="btn-primary w-full">
                  {submitting ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
