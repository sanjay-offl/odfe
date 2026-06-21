"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuArrowLeft, LuSettings, LuBuilding2, LuShoppingBag, LuCreditCard, LuBell, LuShield, LuUser, LuChevronRight, LuSave, LuX } from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiPut } from "@/utils/useApi";

export default function SettingsPage() {
  const { role } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cafeName: "ODFE Cafe",
    currency: "₹ INR",
    timezone: "Asia/Kolkata",
    taxRate: "5",
    language: "English",
    receiptFooter: "Thank you for visiting ODFE Cafe",
    phone: "",
    address: "",
    gstNumber: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await apiFetch("/settings");
      if (res.success && res.data) {
        const s = res.data;
        setSettings(s);
        setForm({
          cafeName: s.cafeName || "ODFE Cafe",
          currency: s.currency || "₹ INR",
          timezone: s.timezone || "Asia/Kolkata",
          taxRate: (s.taxRate || 5).toString(),
          language: s.language || "English",
          receiptFooter: s.receiptFooter || "Thank you for visiting ODFE Cafe",
          phone: s.phone || "",
          address: s.address || "",
          gstNumber: s.gstNumber || "",
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await apiPut("/settings", {
      ...form,
      taxRate: parseFloat(form.taxRate) || 5,
    });
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (role === 'EMPLOYEE') return <div className="min-h-screen bg-cafe-bg flex items-center justify-center"><p className="text-cafe-text-secondary">Access restricted</p></div>;

  if (loading) return <div className="min-h-screen bg-cafe-bg flex items-center justify-center"><p className="text-cafe-text-secondary">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-cafe-bg">
      <header className="flex items-center gap-4 border-b border-cafe-border px-4 lg:px-6 py-4 bg-cafe-cream/40">
        <Link href="/dashboard" className="rounded-btn p-2 text-cafe-text-secondary hover:text-cafe-accent"><LuArrowLeft className="h-5 w-5" /></Link>
        <div className="flex items-center gap-2"><LuSettings className="h-5 w-5 text-cafe-accent" /><h1 className="text-lg text-cafe-text">Settings</h1></div>
        <div className="ml-auto flex items-center gap-3">
          {saved && <span className="text-sm text-emerald-400">Saved!</span>}
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
            <LuSave className="h-4 w-4" />{saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl p-4 lg:p-6 space-y-6">
        {/* General Settings */}
        <div className="glass-panel p-6">
          <h2 className="text-base text-cafe-text mb-6 flex items-center gap-2"><LuBuilding2 className="h-5 w-5 text-cafe-accent" /> General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Cafe Name</label>
              <input value={form.cafeName} onChange={(e) => setForm({ ...form, cafeName: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Currency</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="input-field">
                <option value="₹ INR">₹ INR</option>
                <option value="$ USD">$ USD</option>
                <option value="€ EUR">€ EUR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Timezone</label>
              <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="input-field">
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Tax Rate (%)</label>
              <input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Language</label>
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="input-field">
                <option value="English">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Address</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-cafe-text-secondary mb-1">GST Number</label>
              <input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} className="input-field" />
            </div>
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="glass-panel p-6">
          <h2 className="text-base text-cafe-text mb-6 flex items-center gap-2"><LuShoppingBag className="h-5 w-5 text-cafe-accent" /> Receipt</h2>
          <div>
            <label className="block text-sm font-medium text-cafe-text-secondary mb-1">Receipt Footer</label>
            <textarea value={form.receiptFooter} onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })} className="input-field" rows={2} />
          </div>
        </div>

        {/* Profile Link */}
        <Link href="/settings/profile" className="glass-panel p-6 flex items-center gap-4 hover:bg-cafe-cream/30 transition-colors">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cafe-accent/10">
            <LuUser className="h-5 w-5 text-cafe-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-cafe-text">Profile Settings</h3>
            <p className="mt-0.5 text-xs text-cafe-text-secondary">Manage your account information</p>
          </div>
          <LuChevronRight className="h-5 w-5 text-cafe-text-secondary" />
        </Link>
      </div>
    </div>
  );
}
