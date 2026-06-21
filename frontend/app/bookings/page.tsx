"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuArrowLeft, LuCalendarDays, LuClock, LuUsers, LuPlus, LuX, LuChevronLeft, LuChevronRight, LuTrash2 } from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiPost, apiDelete } from "@/utils/useApi";

interface Booking {
  id: string;
  bookingTime: string;
  partySize: number;
  status: string;
  table?: { name: string };
  customer?: { name: string; phone?: string };
  customerId?: string;
}

export default function BookingsPage() {
  const { role } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState({ customerId: "", tableId: "", partySize: "2", bookingTime: "", status: "Confirmed" });

  const load = async () => {
    setLoading(true);
    const [bookRes, custRes, tableRes] = await Promise.all([
      apiFetch("/bookings"),
      apiFetch("/customers"),
      apiFetch("/tables/tables"),
    ]);
    if (bookRes.success) setBookings(bookRes.data || []);
    if (custRes.success) setCustomers(custRes.data || []);
    if (tableRes.success) setTables(tableRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = bookings.filter((b) => b.bookingTime?.slice(0, 10) === selectedDate);

  const getDates = () => {
    const dates = [];
    for (let i = -3; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  };

  const openCreate = () => {
    setForm({ customerId: "", tableId: "", partySize: "2", bookingTime: `${selectedDate}T19:00`, status: "Confirmed" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.customerId || !form.tableId || !form.bookingTime) return;
    const res = await apiPost("/bookings", {
      customerId: form.customerId,
      tableId: form.tableId,
      partySize: parseInt(form.partySize),
      bookingTime: new Date(form.bookingTime).toISOString(),
      status: form.status,
    });
    if (res.success) { setShowModal(false); load(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;
    const res = await apiDelete(`/bookings/${id}`);
    if (res.success) load();
  };

  const statusColors: Record<string, string> = {
    Confirmed: "bg-emerald-500/15 text-emerald-400",
    Pending: "bg-amber-500/15 text-amber-400",
    Cancelled: "bg-red-500/15 text-red-400",
    Completed: "bg-blue-500/15 text-blue-400",
  };

  if (role === 'EMPLOYEE') return <div className="min-h-screen bg-cafe-bg flex items-center justify-center"><p className="text-cafe-text-secondary">Access restricted</p></div>;

  return (
    <div className="min-h-screen bg-cafe-bg">
      <header className="flex items-center gap-4 border-b border-cafe-border px-4 lg:px-6 py-4 bg-cafe-cream/40">
        <Link href="/dashboard" className="rounded-btn p-2 text-cafe-text-secondary hover:text-cafe-accent"><LuArrowLeft className="h-5 w-5" /></Link>
        <div className="flex items-center gap-2"><LuCalendarDays className="h-5 w-5 text-cafe-accent" /><h1 className="text-lg text-cafe-text">Bookings</h1></div>
        <button onClick={openCreate} className="btn-primary ml-auto flex items-center gap-2 text-sm"><LuPlus className="h-4 w-4" />New Booking</button>
      </header>

      <div className="p-4 lg:p-6">
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          {getDates().map((date) => (
            <button key={date} onClick={() => setSelectedDate(date)}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${selectedDate === date ? "bg-cafe-accent/10 text-cafe-accent" : "text-cafe-text-secondary hover:bg-cafe-cream/60"}`}>
              {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-cafe-text-secondary">Loading...</div>
        ) : (
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-sans">
                <thead>
                  <tr className="border-b border-cafe-border">
                    <th className="px-5 py-4 font-medium text-cafe-text-secondary text-xs uppercase">Guest</th>
                    <th className="px-5 py-4 font-medium text-cafe-text-secondary text-xs uppercase">Date & Time</th>
                    <th className="px-5 py-4 font-medium text-cafe-text-secondary text-xs uppercase">Party</th>
                    <th className="px-5 py-4 font-medium text-cafe-text-secondary text-xs uppercase">Table</th>
                    <th className="px-5 py-4 font-medium text-cafe-text-secondary text-xs uppercase">Status</th>
                    <th className="px-5 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cafe-border/50">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-cafe-text-secondary">No bookings for this date</td></tr>
                  ) : (
                    filtered.map((booking) => (
                      <tr key={booking.id} className="text-cafe-text-secondary hover:bg-cafe-cream/30 transition-colors">
                        <td className="px-5 py-4 font-medium text-cafe-text">{booking.customer?.name || "Walk-in"}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span>{new Date(booking.bookingTime).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1 text-cafe-text-secondary"><LuClock className="h-3.5 w-3.5" />{new Date(booking.bookingTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4"><span className="flex items-center gap-1"><LuUsers className="h-3.5 w-3.5 text-cafe-text-secondary" />{booking.partySize}</span></td>
                        <td className="px-5 py-4 font-medium text-cafe-text">{booking.table?.name || "N/A"}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[booking.status] || "bg-gray-500/15 text-gray-400"}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button onClick={() => handleDelete(booking.id)} className="text-cafe-text-secondary/40 hover:text-red-400 transition-colors"><LuTrash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-cafe-bg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg text-cafe-text">New Booking</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-cafe-text-secondary hover:text-cafe-accent"><LuX className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Customer</label>
                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="input-field">
                  <option value="">Select customer</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Table</label>
                  <select value={form.tableId} onChange={(e) => setForm({ ...form, tableId: e.target.value })} className="input-field">
                    <option value="">Select table</option>
                    {tables.filter((t: any) => t.status === "AVAILABLE").map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.capacity} seats)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Party Size</label>
                  <input type="number" value={form.partySize} onChange={(e) => setForm({ ...form, partySize: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Date & Time</label>
                <input type="datetime-local" value={form.bookingTime} onChange={(e) => setForm({ ...form, bookingTime: e.target.value })} className="input-field" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} className="btn-primary">Create Booking</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
