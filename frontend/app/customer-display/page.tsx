"use client";

import { useState, useEffect } from "react";
import { LuSmartphone, LuCheck, LuRefreshCw } from "react-icons/lu";
import { apiFetch } from "@/utils/useApi";
import { supabase } from "@/utils/supabaseClient";

export default function CustomerDisplayPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await apiFetch("/orders");
      if (res.success && res.data) {
        const activeOrders = res.data.filter((o: any) =>
          ["QUEUED", "PREPARING", "READY", "SERVED"].includes(o.status)
        ).slice(0, 5);
        setOrders(activeOrders);
      }
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('customer-display-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Order' }, () => fetchOrders())
      .subscribe();
    const interval = setInterval(fetchOrders, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const currentOrder = orders[0];

  return (
    <div className="flex min-h-screen bg-cafe-bg flex-col">
      <header className="flex items-center justify-between border-b border-cafe-border px-6 py-4 bg-cafe-cream/40">
        <div className="flex items-center gap-2">
          <LuSmartphone className="h-5 w-5 text-cafe-accent" />
          <h1 className="text-lg text-cafe-text">Customer Display</h1>
        </div>
        <button onClick={fetchOrders} className="rounded-btn p-2 text-cafe-text-secondary hover:text-cafe-accent">
          <LuRefreshCw className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8">
        {loading ? (
          <p className="text-cafe-text-secondary">Loading...</p>
        ) : currentOrder ? (
          <div className="w-full max-w-2xl">
            <div className="mb-8 text-center animate-fade-up">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-cafe-accent/10">
                <LuCheck className="h-8 w-8 text-cafe-accent" />
              </div>
              <h2 className="text-3xl font-bold text-cafe-text font-display">Order #{currentOrder.orderNo}</h2>
              <p className="mt-2 text-lg text-cafe-text-secondary">
                {currentOrder.table?.name || "Takeaway"} · {new Date(currentOrder.createdAt).toLocaleTimeString()}
              </p>
              <span className="inline-flex mt-2 rounded-full px-3 py-1 text-sm font-medium bg-cafe-accent/10 text-cafe-accent">
                {currentOrder.status}
              </span>
            </div>

            <div className="glass-panel p-6">
              <div className="space-y-4">
                {(currentOrder.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b border-cafe-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-accent/10 text-sm font-bold text-cafe-accent">
                        {item.quantity}
                      </span>
                      <span className="text-lg text-cafe-text">{item.product?.name || "Item"}</span>
                    </div>
                    <span className="text-lg font-semibold text-cafe-text">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t border-cafe-border pt-6">
                <div className="flex justify-between text-cafe-text-secondary">
                  <span className="text-lg">Subtotal</span>
                  <span className="text-lg">₹{currentOrder.subtotal?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between text-cafe-text-secondary">
                  <span className="text-lg">Tax</span>
                  <span className="text-lg">₹{currentOrder.tax?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between border-t border-cafe-border pt-3">
                  <span className="text-2xl font-bold text-cafe-text">Total</span>
                  <span className="text-2xl font-bold text-cafe-accent">₹{currentOrder.total?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xl font-semibold text-cafe-accent">Thank you for dining with us!</p>
              <p className="mt-2 text-sm text-cafe-text-secondary">We hope to see you again soon.</p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <LuSmartphone className="mx-auto h-16 w-16 text-cafe-text-secondary/20 mb-4" />
            <h2 className="text-2xl text-cafe-text font-display">Welcome to ODFE</h2>
            <p className="mt-2 text-cafe-text-secondary">Waiting for orders...</p>
          </div>
        )}
      </div>
    </div>
  );
}
