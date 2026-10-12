import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, BarChart3, CalendarClock, ChefHat, Coffee, IndianRupee, Plus, ReceiptText,
  ShoppingBag, Timer, TrendingUp, UtensilsCrossed,
} from 'lucide-react';
import { getDashboard } from '../services/api';
import { useDb } from '../services/db';
import { useAsyncData } from '../hooks/useAsync';
import { usePermission, useSettings } from '../hooks/useSettings';
import { money, number, relativeTime, formatTime } from '../lib/format';
import { PageHeader, StatCard, OrderStatusBadge, ProductImage, PopularStar } from '../components/ui/display';
import { Button } from '../components/ui/primitives';
import { ErrorState, StatSkeleton } from '../components/ui/feedback';
import { BarChart, DonutChart, LineChart, RankedBars } from '../components/charts';
import { cartCount } from '../lib/pricing';
import { useAuth } from '../store/auth';
import { HERO_IMAGE } from '../lib/brand';

export function DashboardPage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const services = usePermission('reports.view');
  const user = useAuth((s) => s.user)!;
  const orders = useDb((s) => s.orders);
  const products = useDb((s) => s.products);
  const ingredients = useDb((s) => s.ingredients);
  const categories = useDb((s) => s.categories);

  const { data, loading, error, reload } = useAsyncData(getDashboard, [orders.length], { enabled: true });

  const recentOrders = useMemo(() => [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6), [orders]);
  const kitchenOrders = useMemo(
    () => orders.filter((o) => o.prepStatus === 'NEW' || o.prepStatus === 'PREPARING').sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)).slice(0, 5),
    [orders],
  );
  const popular = useMemo(
    () => [...products].filter((p) => !p.archived && p.popular && p.available).slice(0, 5),
    [products],
  );
  const lowStock = useMemo(() => ingredients.filter((i) => i.quantity <= i.minThreshold).sort((a, b) => a.quantity / a.minThreshold - b.quantity / b.minThreshold).slice(0, 5), [ingredients]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name;

  return (
    <div>
      <PageHeader
        eyebrow={`Good ${greeting()}, ${user.name.split(' ')[0]}`}
        title="Operations dashboard"
        description={services ? 'Live sales, kitchen activity and stock health for today.' : 'Kitchen and order activity for today.'}
        image={HERO_IMAGE}
        actions={
          <>
            {services && <Button variant="secondary" icon={<BarChart3 size={16} />} onClick={() => navigate('/reports')}>Reports</Button>}
            <Button icon={<Plus size={16} />} onClick={() => navigate('/pos')}>New order</Button>
          </>
        }
      />

      {loading && <StatSkeleton />}
      {error && !loading && <div className="card"><ErrorState message={error} onRetry={reload} /></div>}

      {data && !loading && (
        <>
          {services ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard label="Today's sales" value={money(data.summary.todaySales)} hint="Paid orders only" icon={<IndianRupee size={18} />} tone="caramel" trend="Live" />
              <StatCard label="Total orders" value={number(data.summary.todayOrders)} hint="Created today" icon={<ReceiptText size={18} />} tone="blue" />
              <StatCard label="Average order value" value={money(data.summary.averageOrderValue)} hint="Today to date" icon={<TrendingUp size={18} />} tone="sage" />
              <StatCard label="Pending orders" value={number(data.summary.pendingOrders)} hint="New & preparing" icon={<Timer size={18} />} tone="brick" />
              <StatCard label="Best-selling item" value={<span className="text-2xl">{data.summary.bestSeller?.name ?? '—'}</span>} hint={data.summary.bestSeller ? `${data.summary.bestSeller.quantity} sold today` : 'No sales yet'} icon={<Coffee size={18} />} tone="caramel" />
              <StatCard label="Low-stock items" value={number(data.summary.lowStockCount)} hint="At or below threshold" icon={<AlertTriangle size={18} />} tone={data.summary.lowStockCount ? 'brick' : 'sage'} />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard label="Orders today" value={number(data.summary.todayOrders)} icon={<ReceiptText size={18} />} tone="blue" />
              <StatCard label="Pending orders" value={number(data.summary.pendingOrders)} hint="New & preparing" icon={<Timer size={18} />} tone="brick" />
              <StatCard label="Low-stock items" value={number(data.summary.lowStockCount)} icon={<AlertTriangle size={18} />} tone="caramel" />
            </div>
          )}

          {services && (
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <div className="card p-5 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="eyebrow">Sales over time</p>
                    <h3 className="text-lg font-semibold">Revenue today</h3>
                  </div>
                  <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-muted">{money(data.summary.todaySales)}</span>
                </div>
                <LineChart data={data.salesOverTime} />
              </div>
              <div className="card p-5">
                <p className="eyebrow">Payment mix</p>
                <h3 className="mb-4 text-lg font-semibold">Sales by method</h3>
                <DonutChart data={data.salesByPayment} />
              </div>
              <div className="card p-5 lg:col-span-2">
                <p className="eyebrow">Order volume</p>
                <h3 className="mb-4 text-lg font-semibold">Orders by hour</h3>
                <BarChart data={data.ordersByHour} format={(v) => number(v)} color="#638BA8" height={170} />
              </div>
              <div className="card p-5">
                <p className="eyebrow">Best sellers</p>
                <h3 className="mb-4 text-lg font-semibold">Top items today</h3>
                <RankedBars data={data.bestSellers.slice(0, 5).map((b) => ({ label: b.name, value: b.quantity }))} format={(v) => `${number(v)} sold`} />
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between border-b border-line/70 px-5 py-3.5">
                <h3 className="text-base font-semibold">Recent orders</h3>
                <Link to="/orders" className="text-xs font-semibold text-caramel hover:underline">View all</Link>
              </div>
              <ul className="divide-y divide-line/60">
                {recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-sand text-caramel"><ReceiptText size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-roast">{o.number} · {o.customerName ?? o.tableLabel ?? 'Walk-in'}</p>
                      <p className="text-xs text-muted">{cartCount(o.lines)} items · {formatTime(o.createdAt)} · {o.type.replace('_', ' ').toLowerCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{money(o.totals.total)}</p>
                      <OrderStatusBadge status={o.prepStatus} />
                    </div>
                  </li>
                ))}
                {!recentOrders.length && <li className="px-5 py-10 text-center text-sm text-muted">No orders yet today.</li>}
              </ul>
            </div>

            <div className="space-y-5">
              <div className="card">
                <div className="flex items-center justify-between border-b border-line/70 px-5 py-3.5">
                  <h3 className="text-base font-semibold">Kitchen activity</h3>
                  <Link to="/kitchen" className="text-xs font-semibold text-caramel hover:underline">Open KDS</Link>
                </div>
                <ul className="divide-y divide-line/60">
                  {kitchenOrders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-roast">{o.number}</p>
                        <p className="flex items-center gap-1 text-xs text-muted"><ChefHat size={12} />{cartCount(o.lines)} items · {relativeTime(o.createdAt)}</p>
                      </div>
                      <OrderStatusBadge status={o.prepStatus} />
                    </li>
                  ))}
                  {!kitchenOrders.length && <li className="px-5 py-8 text-center text-sm text-muted">The pass is clear.</li>}
                </ul>
              </div>

              <div className="card">
                <div className="flex items-center justify-between border-b border-line/70 px-5 py-3.5">
                  <h3 className="text-base font-semibold">Inventory alerts</h3>
                  <Link to="/inventory" className="text-xs font-semibold text-caramel hover:underline">Manage</Link>
                </div>
                <ul className="divide-y divide-line/60">
                  {lowStock.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-roast">{i.name}</p>
                        <p className="text-xs text-muted">{i.quantity} {i.unit} left · min {i.minThreshold} {i.unit}</p>
                      </div>
                      <span className={`badge ${i.quantity <= 0 ? 'bg-brick-soft text-brick' : 'bg-[#fdf1dc] text-[#9a6b1f]'}`}>{i.quantity <= 0 ? 'Out' : 'Low'}</span>
                    </li>
                  ))}
                  {!lowStock.length && <li className="px-5 py-8 text-center text-sm text-muted">Stock levels look healthy.</li>}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-5 card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="eyebrow">Guest favourites</p>
                <h3 className="text-lg font-semibold">Popular menu items</h3>
              </div>
              <Link to="/menu" className="text-xs font-semibold text-caramel hover:underline">Manage menu</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {popular.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <ProductImage src={p.image} alt={p.name} category={categoryName(p.categoryId)} className="h-12 w-12 shrink-0" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 truncate text-sm font-semibold text-roast">{p.name} <PopularStar /></p>
                    <p className="text-xs text-muted">{money(p.price)}</p>
                  </div>
                </div>
              ))}
              {!popular.length && <p className="col-span-full text-center text-sm text-muted">No popular items set.</p>}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <QuickAction icon={<ShoppingBag size={18} />} title="New order" description="Start a fresh POS order" onClick={() => navigate('/pos')} />
            <QuickAction icon={<UtensilsCrossed size={18} />} title="Add menu item" description="Create a new product" onClick={() => navigate('/menu', { state: { create: true } })} />
            <QuickAction icon={<CalendarClock size={18} />} title="Reservations" description="Manage today's bookings" onClick={() => navigate('/tables')} />
          </div>
          {settings.lowStockAlerts && lowStock.length > 0 && (
            <p className="mt-4 flex items-center gap-2 text-xs text-muted"><AlertTriangle size={13} className="text-honey" />Demo data shown — figures are simulated sample records, not a live ledger.</p>
          )}
        </>
      )}
    </div>
  );
}

function QuickAction({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card flex items-center gap-3 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-sand text-caramel">{icon}</span>
      <span>
        <span className="block text-sm font-semibold text-roast">{title}</span>
        <span className="block text-xs text-muted">{description}</span>
      </span>
    </button>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}
