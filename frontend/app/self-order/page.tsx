"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineQueueList,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineShoppingBag,
  HiOutlineTrash,
} from "react-icons/hi2";

const categories = [
  { id: "all", label: "All", emoji: "🍽️" },
  { id: "burgers", label: "Burgers", emoji: "🍔" },
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "sides", label: "Sides", emoji: "🍟" },
  { id: "drinks", label: "Drinks", emoji: "🥤" },
  { id: "desserts", label: "Desserts", emoji: "🍰" },
];

const menuItems = [
  { id: 1, name: "Classic Burger", price: 12.99, category: "burgers", image: "🍔", desc: "Angus beef patty with lettuce, tomato" },
  { id: 2, name: "Cheese Pizza", price: 14.99, category: "pizza", image: "🍕", desc: "Mozzarella, marinara, fresh basil" },
  { id: 3, name: "French Fries", price: 5.99, category: "sides", image: "🍟", desc: "Crispy golden fries with seasoning" },
  { id: 4, name: "Cola", price: 2.99, category: "drinks", image: "🥤", desc: "Ice-cold refreshing cola" },
  { id: 5, name: "Chicken Wings", price: 9.99, category: "sides", image: "🍗", desc: "Spicy buffalo wings with ranch" },
  { id: 6, name: "Chocolate Cake", price: 7.99, category: "desserts", image: "🍰", desc: "Rich dark chocolate layer cake" },
  { id: 7, name: "BBQ Burger", price: 14.99, category: "burgers", image: "🍔", desc: "Smoky BBQ sauce, crispy onions" },
  { id: 8, name: "Pepperoni Pizza", price: 16.99, category: "pizza", image: "🍕", desc: "Loaded with spicy pepperoni" },
  { id: 9, name: "Onion Rings", price: 6.99, category: "sides", image: "🧅", desc: "Beer-battered crispy rings" },
  { id: 10, name: "Lemonade", price: 3.99, category: "drinks", image: "🍋", desc: "Freshly squeezed lemonade" },
  { id: 11, name: "Ice Cream Sundae", price: 6.99, category: "desserts", image: "🍨", desc: "Vanilla ice cream with toppings" },
  { id: 12, name: "Veggie Burger", price: 11.99, category: "burgers", image: "🥬", desc: "Plant-based patty with avocado" },
];

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export default function SelfOrderPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const filtered = menuItems.filter(
    (item) => activeCategory === "all" || item.category === activeCategory
  );

  const addToCart = (item: (typeof menuItems)[0]) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-white/5 px-6 py-4">
        <Link
          href="/dashboard"
          className="rounded-xl p-2 text-surface-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <HiOutlineArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <HiOutlineQueueList className="h-5 w-5 text-brand-400" />
          <h1 className="text-lg font-bold text-white">Self-Order</h1>
        </div>
        <button
          onClick={() => setShowCart(!showCart)}
          className="relative ml-auto rounded-xl bg-white/5 p-2.5 text-surface-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <HiOutlineShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      {/* QR Code Display */}
      <div className="px-6 pt-6">
        <div className="glass-card mb-6 flex flex-col items-center p-6">
          <p className="mb-3 text-sm text-surface-400">Scan to order from your phone</p>
          <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white p-2">
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 w-4 rounded-sm ${
                    Math.random() > 0.4 ? "bg-surface-950" : "bg-white"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-surface-500">Table T-05 · ODFE Self-Order</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto px-6 pb-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? "bg-brand-500/20 text-brand-400"
                : "text-surface-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => addToCart(item)}
            className="glass-card flex flex-col items-center p-5 text-center hover:border-brand-500/30"
          >
            <span className="mb-3 text-4xl">{item.image}</span>
            <h3 className="text-sm font-semibold text-white">{item.name}</h3>
            <p className="mt-1 text-xs text-surface-500">{item.desc}</p>
            <p className="mt-2 text-base font-bold text-brand-400">${item.price.toFixed(2)}</p>
          </button>
        ))}
      </div>

      {/* Cart Panel */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="w-[380px] bg-surface-950 border-l border-white/5 p-6 flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="text-surface-400 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="py-12 text-center text-surface-500">Cart is empty</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
                      <span className="text-xl">{item.image}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{item.name}</p>
                        <p className="text-xs text-brand-400">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQuantity(item.id, -1)} className="rounded-lg bg-white/5 p-1 text-surface-400 hover:bg-white/10 hover:text-white">
                          <HiOutlineMinus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="rounded-lg bg-white/5 p-1 text-surface-400 hover:bg-white/10 hover:text-white">
                          <HiOutlinePlus className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeFromCart(item.id)} className="ml-1 rounded-lg p-1 text-red-400/60 hover:bg-red-500/10 hover:text-red-400">
                          <HiOutlineTrash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="mt-4 border-t border-white/5 pt-4">
                <div className="mb-4 flex justify-between text-lg font-bold text-white">
                  <span>Total</span>
                  <span className="gradient-text">${totalPrice.toFixed(2)}</span>
                </div>
                <button className="btn-primary w-full">Place Order</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
