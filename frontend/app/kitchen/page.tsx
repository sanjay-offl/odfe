"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuArrowLeft, LuMonitor, LuClock, LuCheck, LuRefreshCw } from "react-icons/lu";
import { apiFetch, apiPut } from "@/utils/useApi";
import { supabase } from "@/utils/supabaseClient";

interface TicketItem {
  name: string;
  qty: number;
  notes?: string;
}

interface Ticket {
  id: string;
  kitchenOrderId: string;
  orderNo: string;
  table: string;
  server: string;
  items: TicketItem[];
  time: string;
  elapsed: string;
  elapsedMinutes: number;
  createdAt: string;
  status: string;
}

const columnConfig: Record<string, { label: string; dotClass: string; headerClass: string; }> = {
  TO_COOK: { label: "To Cook", dotClass: "bg-cafe-accent", headerClass: "text-cafe-accent" },
  PREPARING: { label: "Preparing", dotClass: "bg-amber-500", headerClass: "text-amber-500" },
  COMPLETED: { label: "Completed", dotClass: "bg-emerald-500", headerClass: "text-emerald-500" },
};

const statusOrder = ["TO_COOK", "PREPARING", "COMPLETED"];

const statusTransitions: Record<string, string> = {
  TO_COOK: "PREPARING",
  PREPARING: "COMPLETED",
  COMPLETED: "COMPLETED",
};

export default function KitchenPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await apiFetch("/kitchen-orders");
      if (response.success && response.data) {
        const formattedTickets = response.data.map((kOrder: any) => {
          const order = kOrder.order;
          const createdAt = new Date(kOrder.createdAt);
          const elapsedMins = Math.floor((Date.now() - createdAt.getTime()) / 60000);
          return {
            id: kOrder.orderId,
            kitchenOrderId: kOrder.id,
            orderNo: order?.orderNo || "Unknown",
            table: order?.table?.name || "Takeaway",
            server: order?.employee?.name || order?.customer?.name || "System",
            status: kOrder.status,
            createdAt: kOrder.createdAt,
            time: createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            elapsed: elapsedMins < 60 ? `${elapsedMins}m` : `${Math.floor(elapsedMins / 60)}h ${elapsedMins % 60}m`,
            elapsedMinutes: elapsedMins,
            items: order?.items?.map((i: any) => ({
              name: i.product?.name || "Item",
              qty: i.quantity,
              notes: i.notes,
            })) || [],
          };
        });
        setTickets(formattedTickets);
      }
    } catch (error) {
      console.error("Failed to fetch tickets", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    const channel = supabase.channel('kitchen-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'KitchenOrder' }, () => fetchOrders())
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const advanceTicket = async (kitchenOrderId: string, currentStatus: string) => {
    const nextStatus = statusTransitions[currentStatus];
    if (!nextStatus || nextStatus === currentStatus) return;
    try {
      await apiPut(`/kitchen-orders/${kitchenOrderId}/status`, { status: nextStatus });
      fetchOrders();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const columns: Record<string, Ticket[]> = {
    TO_COOK: tickets.filter((t) => t.status === "TO_COOK"),
    PREPARING: tickets.filter((t) => t.status === "PREPARING"),
    COMPLETED: tickets.filter((t) => t.status === "COMPLETED"),
  };

  const getElapsedColor = (mins: number) => {
    if (mins > 30) return "text-red-400";
    if (mins > 15) return "text-amber-400";
    return "text-cafe-text-secondary";
  };

  const TicketCard = ({ ticket }: { ticket: Ticket }) => (
    <div className={`glass-card p-4 ${ticket.elapsedMinutes > 20 ? "border-red-400/30" : ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-base font-bold text-cafe-text font-display">{ticket.orderNo}</span>
        <span className="badge badge-queued text-xs">{ticket.table}</span>
      </div>
      <p className="mb-2 text-xs text-cafe-text-secondary font-sans">{ticket.server}</p>
      <div className="space-y-1.5">
        {ticket.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm font-sans">
            <span className="text-cafe-text-secondary">{item.name}</span>
            <span className="font-medium text-cafe-text mono-nums">×{item.qty}</span>
          </div>
        ))}
      </div>
      {ticket.items.some(i => i.notes) && (
        <div className="mt-2 text-xs text-amber-400 italic">
          {ticket.items.filter(i => i.notes).map((item, i) => (
            <div key={i}>{item.name}: {item.notes}</div>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-cafe-border pt-3">
        <span className={`flex items-center gap-1 text-xs font-sans ${getElapsedColor(ticket.elapsedMinutes)}`}>
          <LuClock className="h-3 w-3" strokeWidth={1.5} />
          {ticket.elapsed}
        </span>
        {ticket.status !== "COMPLETED" && (
          <button onClick={() => advanceTicket(ticket.kitchenOrderId, ticket.status)}
            className="btn-secondary !px-3 !py-1 !text-xs flex items-center gap-1">
            <LuCheck className="h-3 w-3" />{statusTransitions[ticket.status] || "Done"}
          </button>
        )}
      </div>
    </div>
  );

  const totalActive = tickets.filter(t => t.status !== "COMPLETED").length;

  return (
    <div className="min-h-screen bg-cafe-bg">
      <header className="flex items-center gap-4 border-b border-cafe-border px-4 lg:px-6 py-4 bg-cafe-cream/40">
        <Link href="/dashboard" className="rounded-btn p-2 text-cafe-text-secondary hover:text-cafe-accent">
          <LuArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <LuMonitor className="h-5 w-5 text-cafe-accent" />
          <h1 className="text-lg text-cafe-text">Kitchen Display</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={fetchOrders} className="rounded-btn p-2 text-cafe-text-secondary hover:text-cafe-accent">
            <LuRefreshCw className="h-4 w-4" />
          </button>
          <span className="badge badge-queued">{totalActive} Active</span>
        </div>
      </header>

      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {statusOrder.map((colKey) => {
            const cfg = columnConfig[colKey];
            const items = columns[colKey];
            return (
              <div key={colKey}>
                <div className="mb-4 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${cfg.dotClass}`} />
                  <h2 className={`text-sm font-semibold font-sans ${cfg.headerClass}`}>{cfg.label}</h2>
                  <span className="ml-auto badge badge-paid text-xs">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {loading && tickets.length === 0 ? (
                    <div className="text-sm text-cafe-text-secondary p-4 text-center font-sans">Loading...</div>
                  ) : items.length === 0 ? (
                    <div className="glass-card flex items-center justify-center p-6 text-sm text-cafe-text-secondary font-sans">
                      {colKey === "TO_COOK" ? "All caught up!" : "Empty"}
                    </div>
                  ) : (
                    items.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}