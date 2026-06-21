"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuArrowLeft, LuUsers, LuSearch, LuPlus, LuPencil, LuTrash2, LuX, LuKey, LuCircleCheck, LuCircleX } from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/utils/useApi";

interface Employee {
  id: string;
  name: string;
  email: string;
  employeeNo: string;
  position?: string;
  shift?: string;
  status: string;
  hourlyRate?: number;
  hireDate?: string;
}

export default function EmployeesPage() {
  const { role } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: "", email: "", position: "Cashier", shift: "Morning", hourlyRate: "15", employeeNo: "" });

  const load = async () => {
    setLoading(true);
    const res = await apiFetch("/employees");
    if (res.success && res.data) setEmployees(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    const nextNo = `EMP${String(employees.length + 1).padStart(3, '0')}`;
    setForm({ name: "", email: "", position: "Cashier", shift: "Morning", hourlyRate: "15", employeeNo: nextNo });
    setShowModal(true);
  };

  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({
      name: e.name,
      email: e.email,
      position: e.position || "Cashier",
      shift: e.shift || "Morning",
      hourlyRate: (e.hourlyRate || 15).toString(),
      employeeNo: e.employeeNo,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    const payload = {
      name: form.name,
      email: form.email,
      position: form.position,
      shift: form.shift,
      hourlyRate: parseFloat(form.hourlyRate) || 15,
      employeeNo: form.employeeNo,
    };
    const res = editing ? await apiPut(`/employees/${editing.id}`, payload) : await apiPost("/employees", payload);
    if (res.success) { setShowModal(false); load(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this employee?")) return;
    const res = await apiDelete(`/employees/${id}`);
    if (res.success) load();
  };

  if (role === 'EMPLOYEE') return <div className="min-h-screen bg-cafe-bg flex items-center justify-center"><p className="text-cafe-text-secondary">Access restricted</p></div>;

  return (
    <div className="min-h-screen bg-cafe-bg">
      <header className="flex items-center gap-4 border-b border-cafe-border px-4 lg:px-6 py-4 bg-cafe-cream/40">
        <Link href="/dashboard" className="rounded-btn p-2 text-cafe-text-secondary hover:text-cafe-accent"><LuArrowLeft className="h-5 w-5" /></Link>
        <div className="flex items-center gap-2"><LuUsers className="h-5 w-5 text-cafe-accent" /><h1 className="text-lg text-cafe-text">Employees</h1></div>
        <button onClick={openCreate} className="btn-primary ml-auto flex items-center gap-2 text-sm"><LuPlus className="h-4 w-4" />Add Employee</button>
      </header>

      <div className="p-4 lg:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <LuSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cafe-text-secondary/50" />
            <input type="text" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <span className="text-sm text-cafe-text-secondary">{filtered.length} employees</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-cafe-text-secondary">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((emp) => (
              <div key={emp.id} className="glass-card p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cafe-accent/10 text-sm font-bold text-cafe-accent">
                    {emp.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-sm font-semibold text-cafe-text">{emp.name}</h3>
                    <p className="truncate text-xs text-cafe-text-secondary">{emp.employeeNo}</p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs ${emp.status === "Active" ? "text-emerald-400" : "text-red-400"}`}>
                    {emp.status === "Active" ? <LuCircleCheck className="h-3 w-3" /> : <LuCircleX className="h-3 w-3" />}
                    {emp.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-cafe-text-secondary">Email</span><span className="text-cafe-text">{emp.email}</span></div>
                  <div className="flex justify-between"><span className="text-cafe-text-secondary">Position</span><span className="text-cafe-text">{emp.position || "Cashier"}</span></div>
                  <div className="flex justify-between"><span className="text-cafe-text-secondary">Shift</span><span className="text-cafe-text">{emp.shift || "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-cafe-text-secondary">Rate</span><span className="text-cafe-text">₹{emp.hourlyRate || 15}/hr</span></div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEdit(emp)} className="flex-1 rounded-btn bg-cafe-cream/60 py-2 text-xs font-medium text-cafe-text-secondary hover:text-cafe-accent"><LuPencil className="h-3.5 w-3.5 inline mr-1" />Edit</button>
                  <button onClick={() => handleDelete(emp.id)} className="rounded-btn bg-cafe-cream/60 p-2 text-cafe-text-secondary hover:text-red-400"><LuTrash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-cafe-bg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg text-cafe-text">{editing ? "Edit Employee" : "Add Employee"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-cafe-text-secondary hover:text-cafe-accent"><LuX className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Employee No</label>
                  <input value={form.employeeNo} onChange={(e) => setForm({ ...form, employeeNo: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Position</label>
                  <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="input-field">
                    <option value="Cashier">Cashier</option>
                    <option value="Waiter">Waiter</option>
                    <option value="Chef">Chef</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Shift</label>
                  <select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} className="input-field">
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="Weekend">Weekend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Hourly Rate (₹)</label>
                  <input type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} className="btn-primary">{editing ? "Update" : "Create"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
