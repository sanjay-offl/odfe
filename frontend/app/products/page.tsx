"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineQueueList,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
} from "react-icons/hi2";

const products = [
  { id: 1, name: "Classic Burger", price: 12.99, category: "Burgers", stock: 48, image: "🍔" },
  { id: 2, name: "Cheese Pizza", price: 14.99, category: "Pizza", stock: 32, image: "🍕" },
  { id: 3, name: "French Fries", price: 5.99, category: "Sides", stock: 120, image: "🍟" },
  { id: 4, name: "Cola", price: 2.99, category: "Drinks", stock: 200, image: "🥤" },
  { id: 5, name: "Chicken Wings", price: 9.99, category: "Sides", stock: 36, image: "🍗" },
  { id: 6, name: "Chocolate Cake", price: 7.99, category: "Desserts", stock: 15, image: "🍰" },
  { id: 7, name: "BBQ Burger", price: 14.99, category: "Burgers", stock: 42, image: "🍔" },
  { id: 8, name: "Pepperoni Pizza", price: 16.99, category: "Pizza", stock: 28, image: "🍕" },
  { id: 9, name: "Onion Rings", price: 6.99, category: "Sides", stock: 0, image: "🧅" },
  { id: 10, name: "Lemonade", price: 3.99, category: "Drinks", stock: 85, image: "🍋" },
  { id: 11, name: "Ice Cream Sundae", price: 6.99, category: "Desserts", stock: 20, image: "🍨" },
  { id: 12, name: "Veggie Burger", price: 11.99, category: "Burgers", stock: 3, image: "🥬" },
  { id: 13, name: "Caesar Salad", price: 8.99, category: "Sides", stock: 0, image: "🥗" },
  { id: 14, name: "Milkshake", price: 5.99, category: "Drinks", stock: 60, image: "🥛" },
  { id: 15, name: "Tiramisu", price: 8.99, category: "Desserts", stock: 12, image: "☕" },
  { id: 16, name: "Garlic Bread", price: 4.99, category: "Sides", stock: 55, image: "🧄" },
];

const categories = ["All", "Burgers", "Pizza", "Sides", "Drinks", "Desserts"];

function getStockBadge(stock: number) {
  if (stock === 0)
    return <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">Out of Stock</span>;
  if (stock <= 10)
    return <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">Low Stock ({stock})</span>;
  return <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-brand-400">In Stock ({stock})</span>;
}

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      (activeCategory === "All" || p.category === activeCategory) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-950">
      <header className="flex items-center gap-4 border-b border-white/5 px-6 py-4">
        <Link
          href="/dashboard"
          className="rounded-xl p-2 text-surface-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <HiOutlineArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <HiOutlineQueueList className="h-5 w-5 text-brand-400" />
          <h1 className="text-lg font-bold text-white">Products</h1>
        </div>
        <button className="btn-primary ml-auto flex items-center gap-2 text-sm">
          <HiOutlinePlus className="h-4 w-4" />
          Add Product
        </button>
      </header>

      <div className="p-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-white/5 p-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-brand-500/20 text-brand-400"
                    : "text-surface-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-surface-500 outline-none focus:border-brand-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <div key={product.id} className="glass-card p-5">
              <div className="mb-3 flex items-start justify-between">
                <span className="text-4xl">{product.image}</span>
                {getStockBadge(product.stock)}
              </div>
              <h3 className="text-base font-semibold text-white">{product.name}</h3>
              <p className="mt-1 text-xs text-surface-500">{product.category}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-lg font-bold text-brand-400">${product.price.toFixed(2)}</p>
                <button className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-surface-300 transition-colors hover:bg-white/10 hover:text-white">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
