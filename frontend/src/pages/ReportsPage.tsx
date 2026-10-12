import { useMemo, useState } from 'react';
import {
  BarChart3, Download, IndianRupee, Percent, ReceiptText, RotateCcw, Timer, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getReport, type ReportRange } from '../services/api';
import { useDb } from '../services/db';
import { useAsyncData } from '../hooks/useAsync';
import { usePermission, useSettings } from '../hooks/useSettings';
import { money, number, percent } from '../lib/format';
import { PageHeader, StatCard } from '../components/ui/display';
import { Button, SegmentedControl } from '../components/ui/primitives';
import { ErrorState, StatSkeleton } from '../components/ui/feedback';
import { BarChart, DonutChart, LineChart, RankedBars } from '../components/charts';

const RANGES: { value: ReportRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
];

export function ReportsPage() {
  useSettings();
  const canView = usePermission('reports.view');
  const orders = useDb((s) => s.orders);
  const [range, setRange] = useState<ReportRange>('week');

  const { data, loading, error, reload } = useAsyncData(() => getReport(range), [range, orders.length]);

  const summary = data?.summary;
  const netRevenue = useMemo(() => {
    if (!data) return 0;
    return Math.max(0, data.summary.todaySales - data.discounts - data.refunds);
  }, [data]);

  const exportCsv = () => {
    if (!data) return;
    const rows: (string | number)[][] = [
      ['ODFE Cafe POS — sales report'],
      ['Range', data.rangeLabel],
      ['Generated', new Date().toISOString()],
      [],
      ['Metric', 'Value'],
      ['Gross sales', data.summary.todaySales],
      ['Orders', data.summary.todayOrders],
      ['Average order value', data.summary.averageOrderValue],
      ['Pending orders', data.summary.pendingOrders],
      ['Discounts', data.discounts],
      ['Refunds', data.refunds],
      [],
      ['Sales over time', 'Value'],
      ...data.salesOverTime.map((p) => [p.label, p.value]),
      [],
      ['Best sellers', 'Quantity', 'Revenue'],
      ...data.bestSellers.map((b) => [b.name, b.quantity, b.revenue]),
      [],
      ['Sales by category', 'Value'],
      ...data.salesByCategory.map((p) => [p.label, p.value]),
      [],
      ['Sales by payment method', 'Value'],
      ...data.salesByPayment.map((p) => [p.label, p.value]),
      [],
      ['Order status', 'Count'],
      ...data.orderStatus.map((p) => [p.label, p.value]),
    ];
    downloadCsv(`odfe-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success('Report exported as CSV');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Reports & analytics"
        description="Sales, product mix and payment performance across any period. Figures are simulated demo data."
        actions={
          <>
            <Button variant="secondary" icon={<Download size={16} />} onClick={exportCsv} disabled={!data}>Export CSV</Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl value={range} onChange={setRange} options={RANGES} />
        {data && <span className="text-xs font-semibold text-muted">{data.rangeLabel} · {number(data.summary.todayOrders)} orders</span>}
      </div>

      {!canView && <p className="mb-4 rounded-xl bg-[#fdf1dc] px-4 py-3 text-sm text-[#9a6b1f]">Your role has read-only visibility into reports.</p>}

      {loading && <StatSkeleton />}
      {error && !loading && <div className="card"><ErrorState message={error} onRetry={reload} /></div>}

      {data && !loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Gross sales" value={money(data.summary.todaySales)} hint={`${data.rangeLabel} · paid only`} icon={<IndianRupee size={18} />} tone="caramel" />
            <StatCard label="Net revenue" value={money(netRevenue)} hint="After discounts & refunds" icon={<TrendingUp size={18} />} tone="sage" />
            <StatCard label="Orders" value={number(data.summary.todayOrders)} hint={data.rangeLabel} icon={<ReceiptText size={18} />} tone="blue" />
            <StatCard label="Average order value" value={money(data.summary.averageOrderValue)} hint="Per paid order" icon={<BarChart3 size={18} />} tone="default" />
            <StatCard label="Discounts given" value={money(data.discounts)} hint={percent((data.summary.todaySales ? (data.discounts / data.summary.todaySales) * 100 : 0), 1)} icon={<Percent size={18} />} tone="brick" />
            <StatCard label="Refunds" value={money(data.refunds)} hint="Returned to guests" icon={<RotateCcw size={18} />} tone={data.refunds ? 'brick' : 'sage'} />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="eyebrow">Sales trend</p>
                  <h3 className="text-lg font-semibold">Revenue · {data.rangeLabel}</h3>
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
              <div className="mb-4">
                <p className="eyebrow">Product mix</p>
                <h3 className="text-lg font-semibold">Sales by category</h3>
              </div>
              <DonutChart data={data.salesByCategory} />
            </div>

            <div className="card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Timer size={16} className="text-caramel" />
                <div>
                  <p className="eyebrow">Service tempo</p>
                  <h3 className="text-lg font-semibold">Orders by hour</h3>
                </div>
              </div>
              <BarChart data={data.ordersByHour} format={(v) => number(v)} color="#638BA8" height={170} />
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="card p-5">
              <div className="mb-4">
                <p className="eyebrow">Winners</p>
                <h3 className="text-lg font-semibold">Best-selling items</h3>
              </div>
              <RankedBars data={data.bestSellers.map((b) => ({ label: b.name, value: b.quantity }))} format={(v) => `${number(v)} sold`} />
            </div>

            <div className="card p-5">
              <div className="mb-4">
                <p className="eyebrow">Kitchen</p>
                <h3 className="text-lg font-semibold">Order status distribution</h3>
              </div>
              <BarChart data={data.orderStatus} format={(v) => number(v)} color="#6B8F71" height={190} />
            </div>
          </div>

          <div className="card mt-5">
            <div className="border-b border-line/70 px-5 py-3.5">
              <h3 className="text-base font-semibold">Best sellers detail</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="table-head px-5 py-3 text-left">Rank</th>
                    <th className="table-head px-5 py-3 text-left">Item</th>
                    <th className="table-head px-5 py-3 text-right">Qty sold</th>
                    <th className="table-head px-5 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bestSellers.map((b, i) => (
                    <tr key={b.productId} className="border-b border-line/60 last:border-0">
                      <td className="px-5 py-3 font-display text-lg text-muted">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-roast">{b.name}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{number(b.quantity)}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">{money(b.revenue)}</td>
                    </tr>
                  ))}
                  {!data.bestSellers.length && (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted">No sales in this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = rows.map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
