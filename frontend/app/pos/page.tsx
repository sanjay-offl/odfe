"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  LuArrowLeft, LuShoppingBag, LuSearch, LuPlus, LuMinus, LuTrash2,
  LuCreditCard, LuBanknote, LuSmartphone, LuSplit, LuX, LuPrinter,
  LuMail, LuPercent, LuTag, LuScissors, LuCalculator, LuRotateCcw,
  LuCheck, LuPause, LuPlay, LuClipboardList, LuUsers,
} from "react-icons/lu";
import { apiFetch, apiPost } from "@/utils/useApi";
import { supabase } from "@/utils/supabaseClient";

interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  category?: { id: string; name: string };
  image?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  notes?: string;
}

export default function POSPage() {
  const [categories, setCategories] = useState<any[]>([{ id: "all", name: "All" }]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [showSplit, setShowSplit] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [showCashCalc, setShowCashCalc] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [kitchenNotes, setKitchenNotes] = useState("");
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [showFloorPopup, setShowFloorPopup] = useState(true);
  const [floors, setFloors] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string>("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);

  const loadData = async () => {
    try {
      // Load categories
      const catRes = await apiFetch('/categories');
      if (catRes.success && catRes.data) {
        setCategories([{ id: 'all', name: 'All' }, ...catRes.data.map((c: any) => ({ id: c.id, name: c.name }))]);
      }

      // Load products
      const prodRes = await apiFetch('/products');
      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          categoryId: p.categoryId || 'all',
          category: p.category ? { id: p.category.id, name: p.category.name } : undefined,
          image: p.image || '☕',
        })));
      }

      // Load floors
      const floorRes = await apiFetch('/tables/floors');
      if (floorRes.success && floorRes.data) {
        setFloors(floorRes.data);
        if (floorRes.data.length > 0) setActiveFloorId(floorRes.data[0].id);
      }

      // Load customers
      const custRes = await apiFetch('/customers');
      if (custRes.success && custRes.data) {
        setCustomers(custRes.data);
      }
    } catch (error) {
      console.error('Failed to load POS data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const channel = supabase.channel('pos-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Product' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Category' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (activeFloorId) {
      apiFetch(`/tables/tables?floorId=${activeFloorId}`).then(res => {
        if (res.success && res.data) {
          setTables(res.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            capacity: t.capacity,
            status: t.status,
            floorId: t.floorId,
          })));
        }
      });
    }
  }, [activeFloorId]);

  const filtered = products.filter(
    (p) => (activeCategory === "all" || p.categoryId === activeCategory) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1, notes: "" }];
    });
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((item) => item.id !== id));
  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map((item) => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter((item) => item.quantity > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percentage") discountAmount = subtotal * (appliedCoupon.discountValue / 100);
    else discountAmount = appliedCoupon.discountValue;
  } else if (showDiscount && discountValue) {
    if (discountType === "percentage") discountAmount = subtotal * (parseFloat(discountValue) / 100);
    else discountAmount = parseFloat(discountValue);
  }
  discountAmount = Math.min(discountAmount, subtotal);

  const tax = (subtotal - discountAmount) * 0.08;
  const total = subtotal - discountAmount + tax;

  const splitAmount = splitCount > 0 ? total / splitCount : total;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    const res = await apiFetch("/coupons");
    if (res.success && res.data) {
      const coupon = res.data.find((c: any) => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive);
      if (coupon) {
        setAppliedCoupon(coupon);
        setShowDiscount(false);
      } else {
        alert("Invalid or expired coupon");
      }
    }
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const payload: any = {
        items: cart.map((item) => ({ productId: item.id, quantity: item.quantity, price: item.price, notes: item.notes })),
        subtotal,
        tax,
        discount: discountAmount,
        total,
        paymentMethod,
        tableId: selectedTable?.id || null,
        customerId: selectedCustomer?.id || null,
        notes: orderNotes,
        kitchenNotes,
      };

      const response = await apiPost("/orders", payload);
      if (response.success) {
        setLastOrder({ ...payload, orderNo: response.data?.orderNo || "ORD-0000" });
        setShowReceipt(true);
        setCart([]);
        setAppliedCoupon(null);
        setDiscountValue("");
        setOrderNotes("");
        setKitchenNotes("");
        setSelectedCustomer(null);
      } else {
        alert(response.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Order submission failed:", error);
      alert("Order submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const held = { id: Date.now().toString(), cart: [...cart], subtotal, discount: discountAmount, tax, total, table: selectedTable, coupon: appliedCoupon, time: new Date().toLocaleTimeString() };
    setHeldOrders((prev) => [...prev, held]);
    setCart([]);
    setAppliedCoupon(null);
    setDiscountValue("");
  };

  const resumeOrder = (held: any) => {
    setCart(held.cart);
    setAppliedCoupon(held.coupon);
    setSelectedTable(held.table);
    setHeldOrders((prev) => prev.filter((h) => h.id !== held.id));
    setShowHeldOrders(false);
  };

  const cashOptions = [100, 200, 500, 1000, 2000];

  const handleCashCalc = (amount: number) => {
    setCashAmount(amount.toString());
  };

  const change = cashAmount ? parseFloat(cashAmount) - total : 0;

  const paymentOptions = [
    { key: "CASH", label: "Cash", sub: "Pay with cash", icon: LuBanknote },
    { key: "CARD", label: "Card", sub: "Credit / Debit", icon: LuCreditCard },
    { key: "UPI", label: "UPI", sub: "Google Pay / PhonePe", icon: LuSmartphone },
    { key: "SPLIT", label: "Split", sub: "Split payment", icon: LuSplit },
  ];

  if (showFloorPopup) {
    return (
      <div className="flex h-screen items-center justify-center bg-cafe-bg">
        <div className="glass-panel p-8 w-full max-w-2xl">
          <h2 className="text-2xl text-cafe-text text-center mb-6">Select Floor & Table</h2>
          <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
            {floors.map((f) => (
              <button key={f.id} onClick={() => setActiveFloorId(f.id)}
                className={`whitespace-nowrap rounded-btn px-4 py-2 text-sm font-medium ${activeFloorId === f.id ? "bg-cafe-accent/10 text-cafe-accent" : "text-cafe-text-secondary hover:bg-cafe-cream/60"}`}>
                {f.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6">
            {tables.map((t) => (
              <button key={t.id} onClick={() => setSelectedTable(t)}
                className={`p-4 rounded-btn text-center border transition-all ${selectedTable?.id === t.id ? "border-cafe-accent bg-cafe-accent/10" : "border-cafe-border hover:border-cafe-accent/30"} ${t.status === "OCCUPIED" ? "opacity-50" : ""}`}>
                <p className="text-sm font-bold text-cafe-text">{t.name}</p>
                <p className="text-xs text-cafe-text-secondary">{t.capacity} seats</p>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setSelectedTable(null); setShowFloorPopup(false); }} className="flex-1 btn-secondary">Skip (Takeaway)</button>
            <button onClick={() => selectedTable && setShowFloorPopup(false)} disabled={!selectedTable} className="flex-1 btn-primary">Continue</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-cafe-bg overflow-hidden">
      {/* Products Panel */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center gap-3 border-b border-cafe-border px-4 py-3 bg-cafe-cream/40 shrink-0">
          <button onClick={() => setShowFloorPopup(true)} className="rounded-btn px-3 py-1.5 bg-cafe-accent/10 text-cafe-accent text-sm">
            {selectedTable ? selectedTable.name : "Takeaway"}
          </button>
          <div className="flex gap-1 overflow-x-auto flex-1 mx-2">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap rounded-btn px-3 py-1.5 text-xs font-medium transition-all ${activeCategory === cat.id ? "bg-cafe-accent/10 text-cafe-accent" : "text-cafe-text-secondary"}`}>
                {cat.name}
              </button>
            ))}
          </div>
          <div className="relative w-40 lg:w-56">
            <LuSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cafe-text-secondary/50" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 py-1.5 text-sm" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 lg:p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-cafe-text-secondary">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-cafe-text-secondary">No products</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3">
              {filtered.map((product) => (
                <button key={product.id} onClick={() => addToCart(product)}
                  className="glass-card flex flex-col items-center p-3 lg:p-4 text-center hover:border-cafe-accent/30 transition-all active:scale-95">
                  <span className="mb-1.5 text-2xl lg:text-3xl">{product.image || "☕"}</span>
                  <p className="text-xs lg:text-sm font-semibold text-cafe-text font-sans leading-tight">{product.name}</p>
                  <p className="mt-1 text-xs lg:text-sm font-bold text-cafe-accent">₹{product.price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-72 lg:w-80 xl:w-96 flex flex-col border-l border-cafe-border bg-cafe-cream/20 shrink-0">
        <header className="flex items-center justify-between border-b border-cafe-border px-4 py-3 shrink-0">
          <h2 className="text-sm font-semibold text-cafe-text flex items-center gap-2">
            <LuShoppingBag className="h-4 w-4" />
            Order
            {cart.length > 0 && <span className="badge badge-queued text-xs">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
          </h2>
          <div className="flex gap-1">
            <button onClick={() => setShowHeldOrders(true)} className="rounded-btn p-1.5 text-cafe-text-secondary hover:text-cafe-accent" title="Held Orders"><LuPause className="h-4 w-4" /></button>
            <button onClick={() => setShowCustomerPicker(true)} className="rounded-btn p-1.5 text-cafe-text-secondary hover:text-cafe-accent" title="Select Customer"><LuUsers className="h-4 w-4" /></button>
            <button onClick={() => setCart([])} className="rounded-btn p-1.5 text-cafe-text-secondary hover:text-red-400" title="Clear"><LuTrash2 className="h-4 w-4" /></button>
          </div>
        </header>

        {selectedCustomer && (
          <div className="px-4 py-2 bg-cafe-accent/5 border-b border-cafe-border text-xs text-cafe-accent flex items-center gap-2">
            <LuUsers className="h-3 w-3" />{selectedCustomer.name}
            <button onClick={() => setSelectedCustomer(null)} className="ml-auto"><LuX className="h-3 w-3" /></button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-cafe-text-secondary">
              <LuShoppingBag className="mb-3 h-12 w-12 opacity-20" />
              <p className="text-xs">Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-btn border border-cafe-border bg-white/40 p-2.5">
                <span className="text-lg shrink-0">{item.image || "☕"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-cafe-text truncate">{item.name}</p>
                  <p className="text-xs text-cafe-accent">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => updateQuantity(item.id, -1)} className="rounded-lg bg-cafe-bg/60 p-1 text-cafe-text-secondary hover:text-cafe-accent"><LuMinus className="h-3 w-3" /></button>
                  <span className="w-5 text-center text-xs font-medium text-cafe-text">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="rounded-lg bg-cafe-bg/60 p-1 text-cafe-text-secondary hover:text-cafe-accent"><LuPlus className="h-3 w-3" /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="rounded-lg p-1 text-cafe-text-secondary/40 hover:text-red-400"><LuX className="h-3 w-3" /></button>
              </div>
            ))
          )}
        </div>

        {/* Order Notes */}
        {cart.length > 0 && (
          <div className="px-3 py-2 border-t border-cafe-border">
            <input value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Order notes..." className="input-field py-1.5 text-xs" />
            <input value={kitchenNotes} onChange={(e) => setKitchenNotes(e.target.value)} placeholder="Kitchen notes..." className="input-field py-1.5 text-xs mt-1" />
          </div>
        )}

        {/* Discount/Coupon */}
        {cart.length > 0 && (
          <div className="px-3 py-2 border-t border-cafe-border">
            <div className="flex gap-2 mb-1">
              <button onClick={() => { setShowDiscount(!showDiscount); setShowCashCalc(false); }} className={`text-xs flex items-center gap-1 px-2 py-1 rounded-btn ${showDiscount ? "bg-cafe-accent/10 text-cafe-accent" : "text-cafe-text-secondary"}`}>
                <LuPercent className="h-3 w-3" />Discount
              </button>
              <button onClick={() => { setAppliedCoupon(null); setShowDiscount(false); }} className="text-xs flex items-center gap-1 px-2 py-1 rounded-btn text-cafe-text-secondary">
                <LuTag className="h-3 w-3" />Coupon
              </button>
              <button onClick={() => setShowSplit(!showSplit)} className={`text-xs flex items-center gap-1 px-2 py-1 rounded-btn ${showSplit ? "bg-cafe-accent/10 text-cafe-accent" : "text-cafe-text-secondary"}`}>
                <LuScissors className="h-3 w-3" />Split
              </button>
            </div>
            {showDiscount && (
              <div className="flex gap-2 mt-1">
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="input-field py-1 text-xs w-20">
                  <option value="percentage">%</option>
                  <option value="fixed">₹</option>
                </select>
                <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="input-field py-1 text-xs flex-1" placeholder="Amount" />
                <button onClick={() => { setAppliedCoupon(null); }} className="text-xs px-2 py-1 bg-cafe-accent/10 text-cafe-accent rounded-btn">Apply</button>
              </div>
            )}
            {appliedCoupon && (
              <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400">
                <LuTag className="h-3 w-3" />{appliedCoupon.code}
                <button onClick={() => setAppliedCoupon(null)} className="ml-auto"><LuX className="h-3 w-3" /></button>
              </div>
            )}
            {showSplit && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-cafe-text-secondary">Split into</span>
                <input type="number" value={splitCount} onChange={(e) => setSplitCount(Math.max(1, parseInt(e.target.value) || 1))} className="input-field py-1 text-xs w-16 text-center" min="1" />
                <span className="text-xs text-cafe-text-secondary">ways = ₹{splitAmount.toFixed(2)} each</span>
              </div>
            )}
          </div>
        )}

        {/* Totals */}
        <div className="border-t border-cafe-border p-3 space-y-1.5 text-xs shrink-0">
          <div className="flex justify-between text-cafe-text-secondary"><span>Subtotal</span><span className="mono-nums">₹{subtotal.toFixed(2)}</span></div>
          {discountAmount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span className="mono-nums">-₹{discountAmount.toFixed(2)}</span></div>}
          <div className="flex justify-between text-cafe-text-secondary"><span>Tax (8%)</span><span className="mono-nums">₹{tax.toFixed(2)}</span></div>
          <div className="flex justify-between border-t border-cafe-border pt-1.5 text-base font-bold text-cafe-text"><span>Total</span><span className="text-cafe-accent mono-nums">₹{total.toFixed(2)}</span></div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 p-3 border-t border-cafe-border shrink-0">
          <button onClick={handleHoldOrder} disabled={cart.length === 0} className="btn-secondary !py-2 text-xs flex items-center justify-center gap-1">
            <LuPause className="h-3.5 w-3.5" />Hold
          </button>
          <button onClick={() => setShowCashCalc(!showCashCalc)} disabled={cart.length === 0} className={`btn-secondary !py-2 text-xs flex items-center justify-center gap-1 ${showCashCalc ? "!bg-cafe-accent/10 !text-cafe-accent" : ""}`}>
            <LuCalculator className="h-3.5 w-3.5" />Cash
          </button>
        </div>

        {/* Cash Calculator */}
        {showCashCalc && (
          <div className="border-t border-cafe-border p-3 bg-cafe-cream/40 shrink-0">
            <div className="grid grid-cols-4 gap-2 mb-2">
              {cashOptions.map((amt) => (
                <button key={amt} onClick={() => handleCashCalc(amt)} className="btn-secondary !py-1.5 text-xs">₹{amt}</button>
              ))}
            </div>
            <div className="flex gap-2 mb-2">
              <input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} className="input-field py-1.5 text-sm flex-1" placeholder="Custom amount" />
              <button onClick={() => handleCashCalc(total)} className="btn-secondary !py-1.5 text-xs">Exact</button>
            </div>
            {cashAmount && parseFloat(cashAmount) >= total && (
              <div className="flex justify-between text-sm">
                <span className="text-cafe-text-secondary">Change</span>
                <span className="font-bold text-emerald-400">₹{change.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Pay Button */}
        <button onClick={handleCompleteSale} disabled={cart.length === 0 || submitting}
          className="shrink-0 bg-cafe-accent text-white py-3 px-4 text-sm font-bold hover:bg-cafe-hover transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
          {submitting ? "Processing..." : `Pay ₹${total.toFixed(2)}`}
        </button>
      </div>

      {/* Held Orders Modal */}
      {showHeldOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowHeldOrders(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-cafe-bg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg text-cafe-text mb-4">Held Orders ({heldOrders.length})</h2>
            {heldOrders.length === 0 ? <p className="text-cafe-text-secondary text-sm">No held orders</p> : (
              <div className="space-y-3">
                {heldOrders.map((held) => (
                  <div key={held.id} className="flex items-center justify-between p-3 rounded-btn border border-cafe-border">
                    <div>
                      <p className="text-sm font-medium text-cafe-text">{held.cart.length} items — ₹{held.total.toFixed(2)}</p>
                      <p className="text-xs text-cafe-text-secondary">{held.time}{held.table ? ` - ${held.table.name}` : ""}</p>
                    </div>
                    <button onClick={() => resumeOrder(held)} className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1">
                      <LuPlay className="h-3 w-3" />Resume
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowHeldOrders(false)} className="mt-4 btn-secondary w-full">Close</button>
          </div>
        </div>
      )}

      {/* Customer Picker */}
      {showCustomerPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCustomerPicker(false)}>
          <div className="w-full max-w-md rounded-2xl bg-cafe-bg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg text-cafe-text mb-4">Select Customer</h2>
            <input className="input-field mb-3" placeholder="Search customers..." onChange={(e) => {}} />
            <div className="max-h-60 overflow-y-auto space-y-2">
              <button onClick={() => { setSelectedCustomer(null); setShowCustomerPicker(false); }} className="w-full text-left p-2 rounded-btn hover:bg-cafe-cream/60 text-sm text-cafe-text-secondary">None (Walk-in)</button>
              {customers.map((c: any) => (
                <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerPicker(false); }}
                  className="w-full text-left p-2 rounded-btn hover:bg-cafe-cream/60 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-cafe-accent/10 flex items-center justify-center text-xs font-bold text-cafe-accent">
                    {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cafe-text">{c.name}</p>
                    <p className="text-xs text-cafe-text-secondary">{c.phone || c.email || ""}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowReceipt(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Order #{lastOrder.orderNo}</h2>
              <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
            </div>
            <div className="border-t border-b border-gray-200 py-3 mb-3 space-y-1.5">
              {lastOrder.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.name || "Item"} × {item.quantity}</span>
                  <span className="text-gray-700">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-sm mb-4">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{lastOrder.subtotal?.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Tax</span><span>₹{lastOrder.tax?.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-gray-800"><span>Total</span><span>₹{lastOrder.total?.toFixed(2)}</span></div>
            </div>
            <p className="text-xs text-center text-gray-400 mb-4">Thank you for visiting!</p>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="btn-secondary flex-1 flex items-center justify-center gap-1 text-xs"><LuPrinter className="h-4 w-4" />Print</button>
              <button onClick={() => setShowReceipt(false)} className="btn-primary flex-1 text-xs">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
