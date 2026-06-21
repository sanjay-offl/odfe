"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuArrowLeft, LuLayoutGrid, LuPlus, LuX, LuPencil, LuTrash2 } from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/utils/useApi";

interface Floor {
  id: string;
  name: string;
  description?: string;
  tables?: Table[];
}

interface Table {
  id: string;
  name: string;
  capacity: number;
  status: string;
  floorId?: string;
  floor?: Floor;
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  AVAILABLE: { label: "Available", color: "border-emerald-500/40 bg-emerald-500/10", dot: "bg-emerald-400" },
  OCCUPIED: { label: "Occupied", color: "border-amber-500/40 bg-amber-500/10", dot: "bg-amber-400" },
  RESERVED: { label: "Reserved", color: "border-violet-500/40 bg-violet-500/10", dot: "bg-violet-400" },
  CLEANING: { label: "Cleaning", color: "border-blue-500/40 bg-blue-500/10", dot: "bg-blue-400" },
};

export default function TablesPage() {
  const { role } = useAuth();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeFloor, setActiveFloor] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [form, setForm] = useState({ name: "", capacity: "4", floorId: "", status: "AVAILABLE" });

  const load = async () => {
    setLoading(true);
    const [floorsRes, tablesRes] = await Promise.all([
      apiFetch("/tables/floors"),
      apiFetch("/tables/tables"),
    ]);
    if (floorsRes.success) setFloors(floorsRes.data || []);
    if (tablesRes.success) setTables(tablesRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredTables = activeFloor === "all" ? tables : tables.filter(t => t.floorId === activeFloor);

  const openCreate = () => {
    setEditingTable(null);
    setForm({ name: "", capacity: "4", floorId: floors[0]?.id || "", status: "AVAILABLE" });
    setShowModal(true);
  };

  const openEdit = (t: Table) => {
    setEditingTable(t);
    setForm({ name: t.name, capacity: t.capacity.toString(), floorId: t.floorId || "", status: t.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    const payload = { name: form.name, capacity: parseInt(form.capacity) || 4, floorId: form.floorId || null, status: form.status };
    const res = editingTable ? await apiPut(`/tables/tables/${editingTable.id}`, payload) : await apiPost("/tables/tables", payload);
    if (res.success) { setShowModal(false); load(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this table?")) return;
    const res = await apiDelete(`/tables/tables/${id}`);
    if (res.success) load();
  };

  if (role === 'EMPLOYEE') return <div className="min-h-screen bg-cafe-bg flex items-center justify-center"><p className="text-cafe-text-secondary">Access restricted to Admin</p></div>;

  const available = tables.filter(t => t.status === "AVAILABLE").length;
  const occupied = tables.filter(t => t.status === "OCCUPIED").length;
  const reserved = tables.filter(t => t.status === "RESERVED").length;

  return (
    <div className="min-h-screen bg-cafe-bg">
      <header className="flex items-center gap-4 border-b border-cafe-border px-4 lg:px-6 py-4 bg-cafe-cream/40">
        <Link href="/dashboard" className="rounded-btn p-2 text-cafe-text-secondary hover:text-cafe-accent"><LuArrowLeft className="h-5 w-5" /></Link>
        <div className="flex items-center gap-2"><LuLayoutGrid className="h-5 w-5 text-cafe-accent" /><h1 className="text-lg text-cafe-text">Table Management</h1></div>
        <button onClick={openCreate} className="btn-primary ml-auto flex items-center gap-2 text-sm"><LuPlus className="h-4 w-4" />Add Table</button>
      </header>

      <div className="p-4 lg:p-6">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {(["available", "occupied", "reserved"] as const).map((s) => {
            const cfg = statusConfig[s.toUpperCase()];
            const count = s === "available" ? available : s === "occupied" ? occupied : reserved;
            return (
              <div key={s} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${cfg?.dot || "bg-gray-400"}`} />
                <span className="text-sm text-cafe-text-secondary">{cfg?.label || s} — {count}</span>
              </div>
            );
          })}
          <div className="flex gap-2 ml-auto overflow-x-auto">
            <button onClick={() => setActiveFloor("all")}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${activeFloor === "all" ? "bg-cafe-accent/10 text-cafe-accent" : "text-cafe-text-secondary"}`}>All Floors</button>
            {floors.map(f => (
              <button key={f.id} onClick={() => setActiveFloor(f.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${activeFloor === f.id ? "bg-cafe-accent/10 text-cafe-accent" : "text-cafe-text-secondary"}`}>{f.name}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-cafe-text-secondary">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredTables.map((table) => {
              const cfg = statusConfig[table.status] || statusConfig.AVAILABLE;
              return (
                <div key={table.id} className={`glass-card border ${cfg.color} p-4 lg:p-5 relative group`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-base lg:text-lg font-bold text-cafe-text">{table.name}</h3>
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color.split(" ")[0].replace("border-", "text-")}`}>
                      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-cafe-text-secondary">{table.capacity} seats</p>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(table)} className="rounded-lg bg-cafe-bg/80 p-1 text-cafe-text-secondary hover:text-cafe-accent"><LuPencil className="h-3 w-3" /></button>
                    <button onClick={() => handleDelete(table.id)} className="rounded-lg bg-cafe-bg/80 p-1 text-cafe-text-secondary hover:text-red-400"><LuTrash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-cafe-bg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg text-cafe-text">{editingTable ? "Edit Table" : "Add Table"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-cafe-text-secondary hover:text-cafe-accent"><LuX className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Table Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Table 1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Capacity</label>
                  <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Floor</label>
                  <select value={form.floorId} onChange={(e) => setForm({ ...form, floorId: e.target.value })} className="input-field">
                    {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="CLEANING">Cleaning</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} className="btn-primary">{editingTable ? "Update" : "Create"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
