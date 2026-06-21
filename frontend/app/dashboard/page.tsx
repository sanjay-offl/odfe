"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuLayoutDashboard,
  LuShoppingBag,
  LuClipboardList,
  LuPackage,
  LuUsers,
  LuLayoutGrid,
  LuCalendarDays,
  LuCreditCard,
  LuTicket,
  LuMonitor,
  LuSmartphone,
  LuQrCode,
  LuChartBar,
  LuSettings,
  LuArrowRight,
  LuBell,
  LuSearch,
  LuTrendingUp,
  LuTrendingDown,
  LuLogOut,
  LuCoffee,
  LuDollarSign,
  LuReceipt,
  LuTableProperties,
  LuTriangle,
} from "react-icons/lu";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabaseClient";
import { apiFetch } from "@/utils/useApi";

const sidebarItems = [
  { label: "Dashboard", icon: LuLayoutDashboard, href: "/dashboard", admin: true, employee: false },
  { label: "POS", icon: LuShoppingBag, href: "/pos", admin: true, employee: true },
  { label: "Orders", icon: LuClipboardList, href: "/orders", admin: true, employee: true },
  { label: "Products", icon: LuPackage, href: "/products", admin: true, employee: false },
  { label: "Customers", icon: LuUsers, href: "/customers", admin: true, employee: true },
  { label: "Tables", icon: LuLayoutGrid, href: "/tables", admin: true, employee: false },
  { label: "Bookings", icon: LuCalendarDays, href: "/bookings", admin: true, employee: false },
  { label: "Payments", icon: LuCreditCard, href: "/payments", admin: true, employee: true },
  { label: "Coupons", icon: LuTicket, href: "/coupons", admin: true, employee: false },
  { label: "Kitchen", icon: LuMonitor, href: "/kitchen", admin: true, employee: true },
  { label: "Customer Display", icon: LuSmartphone, href: "/customer-display", admin: true, employee: false },
  { label: "Self-Order", icon: LuQrCode, href: "/self-order", admin: true, employee: false },
  { label: "Reports", icon: LuChartBar, href: "/reports", admin: true, employee: false },
  { label: "Settings", icon: LuSettings, href: "/settings", admin: true, employee: false },
];

const quickActions = [
  { label: "Open POS", icon: LuShoppingBag, href: "/pos" },
  { label: "Kitchen", icon: LuMonitor, href: "/kitchen" },
  { label: "Orders", icon: LuClipboardList, href: "/orders" },
  { label: "Self-Order", icon: LuSmartphone, href: "/self-order" },
];

const statusBadge: Record<string, string> = {
  Queued: "badge badge-queued",
  Preparing: "badge badge-brewing",
  Ready: "badge badge-served",
  Completed: "badge badge-paid",
  Cancelled: "badge badge-queued",
};

export default function DashboardPage() {
  const { user, role, logout, profile } = useAuth();
  const pathname = usePathname();
  const [kpis, setKpis] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const loadDashboard = async () => {
    try {
      const response = await apiFetch("/dashboard");
      if (response.success && response.data) {
        setKpis(response.data.kpis || []);
        setRecentOrders(response.data.recentOrders || []);
        setTopProducts(response.data.topProducts || []);
        setRevenueChart(response.data.revenueChart || []);
        setLowStock(response.data.lowStock || []);
      } else {
        setKpis([
          { label: "Today's Revenue", value: "₹0", change: "0%", up: true },
          { label: "Orders", value: "0", change: "0%", up: true },
          { label: "Avg Order", value: "₹0", change: "0%", up: true },
          { label: "Active Tables", value: "0/0", change: "0%", up: true },
        ]);
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const channel = supabase
      .channel('dashboard-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Order' }, () => loadDashboard())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const displayName = profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';

  const chartMax = revenueChart.length > 0 ? Math.max(...revenueChart.map((r: any) => r.revenue), 1) : 1;

  return (
    <div className="flex min-h-screen bg-cafe-bg">
      {/* Sidebar */}
      <aside className={`${showMobileSidebar ? 'fixed inset-0 z-50 lg:relative lg:inset-auto' : 'hidden'} lg:block w-60 shrink-0 border-r border-cafe-border bg-cafe-cream/60 p-4`}>
        <div className="flex items-center justify-between mb-8 px-3 pt-2">
          <Link href="/"><Logo height={34} linked={false} /></Link>
          <button onClick={() => setShowMobileSidebar(false)} className="lg:hidden text-cafe-text-secondary">&times;</button>
        </div>
        <nav className="space-y-0.5">
          {sidebarItems
            .filter(item => role === 'ADMIN' ? item.admin : item.employee)
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setShowMobileSidebar(false)}
                  className={`flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium transition-colors font-sans ${isActive ? "bg-cafe-accent/10 text-cafe-accent" : "text-cafe-text-secondary hover:bg-cafe-accent/5 hover:text-cafe-text"}`}>
                  <item.icon className={`h-4 w-4 ${isActive ? "text-cafe-accent" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-between border-b border-cafe-border px-4 lg:px-6 py-4 bg-cafe-cream/40">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowMobileSidebar(true)} className="lg:hidden rounded-btn p-2 text-cafe-text-secondary">
              <LuLayoutDashboard className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl text-cafe-text">Dashboard</h1>
              <p className="text-sm text-cafe-text-secondary font-sans mt-0.5">Welcome back, {displayName}</p>
            </div>
          </div>
          {role === 'ADMIN' && (
            <div className="flex items-center gap-2">
              <button className="rounded-btn p-2.5 text-cafe-text-secondary transition-colors hover:bg-cafe-accent/5 hover:text-cafe-accent" aria-label="Search"><LuSearch className="h-[18px] w-[18px]" strokeWidth={1.5} /></button>
              <button className="relative rounded-btn p-2.5 text-cafe-text-secondary transition-colors hover:bg-cafe-accent/5 hover:text-cafe-accent" aria-label="Notifications">
                <LuBell className="h-[18px] w-[18px]" strokeWidth={1.5} />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cafe-accent" />
              </button>
              <button onClick={() => logout()} className="rounded-btn p-2.5 text-cafe-text-secondary transition-colors hover:bg-cafe-accent/5 hover:text-cafe-accent" aria-label="Logout"><LuLogOut className="h-[18px] w-[18px]" strokeWidth={1.5} /></button>
            </div>
          )}
          {role === 'EMPLOYEE' && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-cafe-text-secondary font-sans">{profile?.shift && `Shift: ${profile.shift}`}</span>
              <button onClick={() => logout()} className="btn-secondary !py-1.5 !px-3 text-sm">Logout</button>
            </div>
          )}
        </header>

        <div className="p-4 lg:p-6">
          {/* KPIs */}
          <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {(kpis.length > 0 ? kpis : [
              { label: "Today's Revenue", value: "₹0", change: "0%", up: true },
              { label: "Orders", value: "0", change: "0%", up: true },
              { label: "Avg Order", value: "₹0", change: "0%", up: true },
              { label: "Active Tables", value: "0/0", change: "0%", up: true },
            ]).map((kpi, i) => (
              <div key={i} className="glass-card p-4 lg:p-6 relative overflow-hidden group">
                <p className="text-xs lg:text-sm font-medium text-cafe-text-secondary font-sans relative z-10">{kpi.label}</p>
                <p className="mt-2 lg:mt-3 text-xl lg:text-2xl font-bold text-cafe-text font-display">{kpi.value}</p>
                <div className={`mt-1 lg:mt-2 flex items-center gap-1 text-xs font-medium font-sans ${kpi.up ? "text-[#5A6448]" : "text-[#B43C1E]"}`}>
                  {kpi.up ? <LuTrendingUp className="h-3 w-3" strokeWidth={2} /> : <LuTrendingDown className="h-3 w-3" strokeWidth={2} />}
                  {kpi.change}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h2 className="mb-4 text-lg text-cafe-text">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href} className="glass-card group flex flex-col items-center p-4 lg:p-6">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[14px] bg-cafe-accent/10">
                    <action.icon className="h-5 w-5 text-cafe-accent" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-semibold text-cafe-text font-sans">{action.label}</span>
                  <LuArrowRight className="mt-2 h-4 w-4 text-cafe-text-secondary/40 transition-transform group-hover:translate-x-1 group-hover:text-cafe-accent" strokeWidth={1.5} />
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 glass-panel p-4 lg:p-6">
              <h2 className="mb-4 text-lg text-cafe-text">Revenue (Last 30 Days)</h2>
              {revenueChart.length > 0 ? (
                <div className="flex items-end gap-1 h-32 lg:h-40">
                  {revenueChart.map((r: any, i: number) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        className="w-full rounded-t bg-cafe-accent/60 hover:bg-cafe-accent transition-colors cursor-pointer"
                        style={{ height: `${Math.max((r.revenue / chartMax) * 100, 2)}%` }}
                        title={`${r.date || ''}: ₹${r.revenue}`}
                      />
                      {revenueChart.length <= 15 && (
                        <span className="text-[8px] text-cafe-text-secondary/60 -rotate-45 origin-left whitespace-nowrap">
                          {r.date?.slice(0, 5) || ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 lg:h-40 flex items-center justify-center text-cafe-text-secondary text-sm">No revenue data</div>
              )}
            </div>

            {/* Top Products */}
            <div className="glass-panel p-4 lg:p-6">
              <h2 className="mb-4 text-lg text-cafe-text">Top Products</h2>
              {topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.slice(0, 6).map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-cafe-text-secondary/40 w-5">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-cafe-text font-sans">{p.name}</p>
                        <div className="w-full h-1.5 rounded-full bg-cafe-border mt-1">
                          <div className="h-full rounded-full bg-cafe-accent/60" style={{ width: `${Math.min(p.percentage || p.count * 5, 100)}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-cafe-text-secondary mono-nums">{p.count || p.quantity || 0}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-cafe-text-secondary text-sm">No product data</div>
              )}
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Recent Orders */}
            <div className="glass-panel p-4 lg:p-6">
              <h2 className="mb-4 text-lg text-cafe-text">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-sans">
                  <thead>
                    <tr className="border-b border-cafe-border">
                      <th className="pb-3 font-medium text-cafe-text-secondary text-xs uppercase tracking-wider">Order</th>
                      <th className="pb-3 font-medium text-cafe-text-secondary text-xs uppercase tracking-wider">Table</th>
                      <th className="pb-3 font-medium text-cafe-text-secondary text-xs uppercase tracking-wider">Items</th>
                      <th className="pb-3 font-medium text-cafe-text-secondary text-xs uppercase tracking-wider">Total</th>
                      <th className="pb-3 font-medium text-cafe-text-secondary text-xs uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cafe-border/50">
                    {recentOrders.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-cafe-text-secondary">No recent orders</td></tr>
                    ) : (
                      recentOrders.map((order: any) => (
                        <tr key={order.id} className="text-cafe-text-secondary hover:bg-cafe-cream/30 transition-colors">
                          <td className="py-3 font-medium text-cafe-text">{order.id}</td>
                          <td className="py-3">{order.table}</td>
                          <td className="py-3">{order.items} items</td>
                          <td className="py-3 font-medium text-cafe-text mono-nums">{order.total}</td>
                          <td className="py-3">
                            <span className={statusBadge[order.status] || "badge badge-queued"}>{order.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Low Stock */}
            <div className="glass-panel p-4 lg:p-6">
              <h2 className="mb-4 text-lg text-cafe-text flex items-center gap-2">
                <LuTriangle className="h-5 w-5 text-amber-400" strokeWidth={1.5} />
                Low Stock Products
              </h2>
              {lowStock.length > 0 ? (
                <div className="space-y-3">
                  {lowStock.slice(0, 8).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-btn bg-cafe-warm/30">
                      <div>
                        <p className="text-sm font-medium text-cafe-text font-sans">{item.name || item.product?.name || 'Unknown'}</p>
                        <p className="text-xs text-cafe-text-secondary">Stock: {item.stock || 0} (Min: {item.minimumStock || 0})</p>
                      </div>
                      <span className="text-xs font-bold text-[#B43C1E]">{item.stock || 0}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-cafe-text-secondary text-sm">All products well stocked</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
