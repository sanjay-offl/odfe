"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuArrowLeft, LuChartBar, LuDollarSign, LuPackage, LuUsers, LuClock, LuDownload, LuCalendarDays, LuTrendingUp } from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/utils/useApi";

export default function ReportsPage() {
  const { role } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await apiFetch("/dashboard");
      if (res.success) setDashboard(res.data);
      setLoading(false);
    };
    load();
  }, []);

  if (role === 'EMPLOYEE') return <div className="min-h-screen bg-cafe-bg flex items-center justify-center"><p className="text-cafe-text-secondary">Access restricted</p></div>;

  const reportTypes = [
    { id: "sales", label: "Sales Report", icon: LuChartBar, desc: "Total sales, items sold, trends", value: dashboard?.kpis?.[0]?.value || "₹0", color: "from-cafe-accent to-cafe-dark" },
    { id: "revenue", label: "Monthly Revenue", icon: LuTrendingUp, desc: "Revenue breakdown by period", value: `₹${(dashboard?.monthlyRevenue || 0).toLocaleString()}`, color: "from-violet-500 to-purple-600" },
    { id: "products", label: "Top Products", icon: LuPackage, desc: "Best selling products", value: `${dashboard?.topProducts?.length || 0} products`, color: "from-amber-500 to-orange-600" },
    { id: "employees", label: "Employees", icon: LuUsers, desc: "Staff performance", value: `${dashboard?.employeesCount || 0} active`, color: "from-cyan-500 to-blue-600" },
  ];

  return (
    <div className="min-h-screen bg-cafe-bg">
      <header className="flex items-center gap-4 border-b border-cafe-border px-4 lg:px-6 py-4 bg-cafe-cream/40">
        <Link href="/dashboard" className="rounded-btn p-2 text-cafe-text-secondary hover:text-cafe-accent"><LuArrowLeft className="h-5 w-5" /></Link>
        <div className="flex items-center gap-2"><LuChartBar className="h-5 w-5 text-cafe-accent" /><h1 className="text-lg text-cafe-text">Reports</h1></div>
      </header>

      <div className="p-4 lg:p-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-btn border border-cafe-border bg-cafe-cream/40 px-4 py-2.5">
            <LuCalendarDays className="h-4 w-4 text-cafe-text-secondary" />
            <span className="text-sm text-cafe-text-secondary">Last 30 Days</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-cafe-text-secondary">Loading...</div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="mb-4 text-base text-cafe-text">Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {reportTypes.map((r) => (
                  <div key={r.id} className="glass-card p-5">
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${r.color} bg-opacity-20`}>
                      <r.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-cafe-text">{r.label}</h3>
                    <p className="mt-1 text-xs text-cafe-text-secondary">{r.desc}</p>
                    <p className="mt-2 text-lg font-bold text-cafe-accent">{r.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Chart */}
            {dashboard?.revenueChart && dashboard.revenueChart.length > 0 && (
              <div className="mb-8 glass-panel p-6">
                <h2 className="mb-4 text-base text-cafe-text">Revenue Trend (30 Days)</h2>
                <div className="flex items-end gap-1 h-40">
                  {(() => {
                    const max = Math.max(...dashboard.revenueChart.map((r: any) => r.revenue), 1);
                    return dashboard.revenueChart.slice(0, 30).map((r: any, i: number) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="w-full rounded-t bg-cafe-accent/60 hover:bg-cafe-accent transition-colors cursor-pointer"
                          style={{ height: `${Math.max((r.revenue / max) * 100, 2)}%` }} />
                        <span className="text-[8px] text-cafe-text-secondary/40">{r.date?.slice(5, 10) || ''}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-panel p-6">
                <h2 className="mb-4 text-base text-cafe-text">Key Metrics</h2>
                <div className="space-y-4">
                  {[
                    { label: "Today's Revenue", value: dashboard?.kpis?.[0]?.value || "₹0" },
                    { label: "Monthly Revenue", value: `₹${(dashboard?.monthlyRevenue || 0).toLocaleString()}` },
                    { label: "Orders Today", value: dashboard?.kpis?.[1]?.value || "0" },
                    { label: "Average Order", value: dashboard?.kpis?.[2]?.value || "₹0" },
                    { label: "Active Tables", value: dashboard?.kpis?.[3]?.value || "0/0" },
                    { label: "Total Customers", value: `${dashboard?.customersCount || 0}` },
                    { label: "Active Employees", value: `${dashboard?.employeesCount || 0}` },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-cafe-border/50 last:border-0">
                      <span className="text-sm text-cafe-text-secondary">{s.label}</span>
                      <span className="text-sm font-semibold text-cafe-text">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-6">
                <h2 className="mb-4 text-base text-cafe-text">Export</h2>
                <p className="text-sm text-cafe-text-secondary mb-4">Download reports for offline analysis.</p>
                <div className="space-y-3">
                  {["Sales Report", "Revenue Report", "Product Report", "Employee Report"].map((name, i) => (
                    <button key={i} className="flex w-full items-center justify-between rounded-btn border border-cafe-border bg-cafe-cream/30 p-4 hover:bg-cafe-cream/60 transition-colors">
                      <span className="text-sm font-medium text-cafe-text">{name}</span>
                      <LuDownload className="h-4 w-4 text-cafe-text-secondary" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
