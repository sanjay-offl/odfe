"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuArrowLeft, LuCreditCard, LuBanknote, LuSmartphone, LuWallet, LuSearch } from "react-icons/lu";
import { apiFetch } from "@/utils/useApi";

export default function PaymentsPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [methodsRes, ordersRes] = await Promise.all([
        apiFetch("/payments/methods"),
        apiFetch("/orders"),
      ]);
      if (methodsRes.success) setMethods(methodsRes.data || []);
      if (ordersRes.success && ordersRes.data) {
        const txns = ordersRes.data
          .filter((o: any) => o.payments?.length > 0)
          .slice(0, 20)
          .flatMap((o: any) =>
            (o.payments || []).map((p: any) => ({
              id: p.id || o.orderNo,
              orderId: o.orderNo,
              method: p.paymentMethod || "Unknown",
              amount: `₹${Number(p.amount || 0).toFixed(2)}`,
              status: p.status || "PENDING",
              time: new Date(p.createdAt || o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }))
          );
        setTransactions(txns);
      }
      setLoading(false);
    };
    load();
  }, []);

  const methodIcons: Record<string, any> = {
    CASH: LuBanknote,
    CARD: LuCreditCard,
    UPI: LuSmartphone,
    WALLET: LuWallet,
  };

  const statusColors: Record<string, string> = {
    COMPLETED: "bg-emerald-500/15 text-emerald-400",
    PENDING: "bg-amber-500/15 text-amber-400",
    FAILED: "bg-red-500/15 text-red-400",
    REFUNDED: "bg-blue-500/15 text-blue-400",
  };

  return (
    <div className="min-h-screen bg-cafe-bg">
      <header className="flex items-center gap-4 border-b border-cafe-border px-4 lg:px-6 py-4 bg-cafe-cream/40">
        <Link href="/dashboard" className="rounded-btn p-2 text-cafe-text-secondary hover:text-cafe-accent"><LuArrowLeft className="h-5 w-5" /></Link>
        <div className="flex items-center gap-2"><LuCreditCard className="h-5 w-5 text-cafe-accent" /><h1 className="text-lg text-cafe-text">Payments</h1></div>
      </header>

      <div className="p-4 lg:p-6">
        <div className="mb-8">
          <h2 className="mb-4 text-base text-cafe-text">Payment Methods</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? <p className="text-cafe-text-secondary col-span-4 text-center py-8">Loading...</p> :
              methods.length === 0 ? (
                <>
                  {["Cash", "Card", "UPI", "Wallet"].map((name, i) => {
                    const Icon = [LuBanknote, LuCreditCard, LuSmartphone, LuWallet][i];
                    return (
                      <div key={name} className="glass-card p-5">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-accent/10">
                          <Icon className="h-5 w-5 text-cafe-accent" />
                        </div>
                        <h3 className="text-sm font-semibold text-cafe-text">{name}</h3>
                      </div>
                    );
                  })}
                </>
              ) : (
                methods.map((m: any) => {
                  const Icon = methodIcons[m.name] || LuCreditCard;
                  return (
                    <div key={m.id} className="glass-card p-5">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-accent/10">
                        <Icon className="h-5 w-5 text-cafe-accent" />
                      </div>
                      <h3 className="text-sm font-semibold text-cafe-text">{m.name}</h3>
                      {m.upiId && <p className="mt-1 text-xs text-cafe-text-secondary">{m.upiId}</p>}
                    </div>
                  );
                })
              )}
          </div>
        </div>

        <div className="glass-panel overflow-hidden">
          <div className="border-b border-cafe-border px-5 py-4">
            <h2 className="text-base text-cafe-text">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead>
                <tr className="border-b border-cafe-border">
                  <th className="px-5 py-3 font-medium text-cafe-text-secondary text-xs uppercase">Order</th>
                  <th className="px-5 py-3 font-medium text-cafe-text-secondary text-xs uppercase">Method</th>
                  <th className="px-5 py-3 font-medium text-cafe-text-secondary text-xs uppercase">Amount</th>
                  <th className="px-5 py-3 font-medium text-cafe-text-secondary text-xs uppercase">Status</th>
                  <th className="px-5 py-3 font-medium text-cafe-text-secondary text-xs uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-border/50">
                {loading ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-cafe-text-secondary">Loading...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-cafe-text-secondary">No transactions</td></tr>
                ) : (
                  transactions.map((txn, i) => (
                    <tr key={txn.id || i} className="text-cafe-text-secondary hover:bg-cafe-cream/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-cafe-text">{txn.orderId}</td>
                      <td className="px-5 py-3">{txn.method}</td>
                      <td className="px-5 py-3 font-medium text-cafe-text mono-nums">{txn.amount}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[txn.status] || "bg-gray-500/15 text-gray-400"}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-cafe-text-secondary">{txn.time}</td>
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
