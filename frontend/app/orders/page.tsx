"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuArrowLeft, LuClipboardList, LuSearch } from "react-icons/lu";
import { apiFetch, apiPut } from "@/utils/useApi";
import { supabase } from "@/utils/supabaseClient";

const statusColors: Record<string, string> = {
  PENDING: "bg-blue-500/15 text-blue-400",
  QUEUED: "bg-blue-500/15 text-blue-400",
  PREPARING: "bg-amber-500/15 text-amber-400",
  READY: "bg-emerald-500/15 text-emerald-400",
  SERVED: "bg-emerald-500/15 text-emerald-400",
  COMPLETED: "bg-emerald-500/15 text-emerald-400",
  CANCELLED: "bg-red-500/15 text-red-400",
  DRAFT: "bg-gray-500/15 text-gray-400",
};

const filters = ["All", "QUEUED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await apiFetch("/orders");
      if (response.success && response.data) {
        const formatted = response.data.map((order: any) => ({
          id: order.orderNo,
          table: order.table?.name || "Takeaway",
          server: order.employee?.name || order.user?.name || "System",
          items: order.items?.length || 0,
          total: `₹${Number(order.total || 0).toFixed(2)}`,
          status: order.status,
          time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          _raw: order,
        }));
        setOrders(formatted);
      }
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Order' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (orderNo: string, status: string) => {
    await apiPut(`/orders/${orderNo}/status`, { status });
    fetchOrders();
  };

  const statusTransitions: Record<string, string> = {
    QUEUED: "PREPARING",
    PREPARING: "READY",
    READY: "COMPLETED",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
  };

  const filtered = orders.filter(
    (o) =>
      (activeFilter === "All" || o.status === activeFilter) &&
      (o.id.toLowerCase().includes(search.toLowerCase()) || o.table.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-cafe-bg">
      <header className="flex items-center gap-4 border-b border-cafe-border px-4 lg:px-6 py-4 bg-cafe-cream/40">
        <Link href="/dashboard" className="rounded-btn p-2 text-cafe-text-secondary hover:text-cafe-accent"><LuArrowLeft className="h-5 w-5" /></Link>
        <div className="flex items-center gap-2"><LuClipboardList className="h-5 w-5 text-cafe-accent" /><h1 className="text-lg text-cafe-text">Orders</h1></div>
      </header>

      <div className="p-4 lg:p-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-cafe-cream/60 p-1">
            {filters.map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${activeFilter === f ? "bg-cafe-accent/10 text-cafe-accent" : "text-cafe-text-secondary hover:text-cafe-text"}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <LuSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cafe-text-secondary/50" />
            <input type="text" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 py-2 text-sm" />
          </div>
        </div>

        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead>
                <tr className="border-b border-cafe-border">
                  <th className="px-4 lg:px-5 py-4 font-medium text-cafe-text-secondary text-xs uppercase">Order</th>
                  <th className="px-4 lg:px-5 py-4 font-medium text-cafe-text-secondary text-xs uppercase">Table</th>
                  <th className="px-4 lg:px-5 py-4 font-medium text-cafe-text-secondary text-xs uppercase">Server</th>
                  <th className="px-4 lg:px-5 py-4 font-medium text-cafe-text-secondary text-xs uppercase">Items</th>
                  <th className="px-4 lg:px-5 py-4 font-medium text-cafe-text-secondary text-xs uppercase">Total</th>
                  <th className="px-4 lg:px-5 py-4 font-medium text-cafe-text-secondary text-xs uppercase">Status</th>
                  <th className="px-4 lg:px-5 py-4 font-medium text-cafe-text-secondary text-xs uppercase">Time</th>
                  <th className="px-4 lg:px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-border/50">
                {loading ? (
                  <tr><td colSpan={8} className="px-5 py-8 text-center text-cafe-text-secondary">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-cafe-text-secondary"><LuClipboardList className="mx-auto mb-3 h-10 w-10 opacity-30" /><p className="text-sm">No orders found</p></td></tr>
                ) : (
                  filtered.map((order) => (
                    <tr key={order.id} className="text-cafe-text-secondary hover:bg-cafe-cream/30 transition-colors">
                      <td className="px-4 lg:px-5 py-4 font-medium text-cafe-text">{order.id}</td>
                      <td className="px-4 lg:px-5 py-4">{order.table}</td>
                      <td className="px-4 lg:px-5 py-4">{order.server}</td>
                      <td className="px-4 lg:px-5 py-4">{order.items}</td>
                      <td className="px-4 lg:px-5 py-4 font-medium text-cafe-text mono-nums">{order.total}</td>
                      <td className="px-4 lg:px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] || "bg-gray-500/15 text-gray-400"}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 lg:px-5 py-4 text-cafe-text-secondary">{order.time}</td>
                      <td className="px-4 lg:px-5 py-4">
                        {statusTransitions[order.status] && order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                          <button onClick={() => updateStatus(order.id, statusTransitions[order.status])}
                            className="btn-secondary !py-1 !px-2 !text-xs">Advance</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
