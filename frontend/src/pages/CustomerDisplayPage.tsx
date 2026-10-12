import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChefHat, Clock3, Coffee, MonitorSmartphone, Sparkles } from 'lucide-react';
import type { Order, PrepStatus } from '../types';
import { useDb } from '../services/db';
import { useClock } from '../hooks/useAsync';
import { useSettings } from '../hooks/useSettings';
import { money, formatDate, formatTime } from '../lib/format';
import { ProductImage } from '../components/ui/display';
import { LOGO_SRC } from '../lib/brand';

const STEPS: { key: Extract<PrepStatus, 'NEW' | 'PREPARING' | 'READY'>; label: string; blurb: string; icon: typeof Coffee }[] = [
  { key: 'NEW', label: 'Order received', blurb: 'We have your order', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Being prepared', blurb: 'Our team is on it', icon: ChefHat },
  { key: 'READY', label: 'Ready soon', blurb: 'Almost on its way', icon: Sparkles },
];

export function CustomerDisplayPage() {
  const settings = useSettings();
  const orders = useDb((s) => s.orders);
  const products = useDb((s) => s.products);
  const categories = useDb((s) => s.categories);
  const now = useClock(1000);

  // Keep a second screen in sync: other tabs write to the persisted demo DB,
  // which fires a `storage` event we can reload from.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'odfe-demo-db-v1') useDb.getState().reload();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const latest = useMemo(
    () => [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0],
    [orders],
  );
  const active = latest && ['NEW', 'PREPARING', 'READY'].includes(latest.prepStatus) ? latest : undefined;
  const popular = useMemo(
    () => products.filter((p) => !p.archived && p.popular && p.available).slice(0, 6),
    [products],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-espresso text-white">
      <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-caramel/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-sage/20 blur-3xl" />

      <header className="relative flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <img src={LOGO_SRC} alt={settings.cafeName} className="h-10 w-10 rounded-lg object-contain" />
          <span className="leading-tight">
            <span className="block text-xl font-bold tracking-[0.08em]">{settings.cafeName}</span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-white/50">{settings.tagline}</span>
          </span>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold tabular-nums">{formatTime(new Date(now))}</div>
          <div className="text-white/50">{formatDate(new Date(now), { weekday: 'long', day: '2-digit', month: 'long' })}</div>
        </div>
      </header>

      <main className="relative px-6 pb-10 sm:px-10">
        {active ? (
          <ActiveOrder order={active} />
        ) : (
          <Idle products={popular} categoryName={(id) => categories.find((c) => c.id === id)?.name} greeting={settings.receiptHeader} />
        )}
      </main>

      <footer className="relative flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4 text-[11px] text-white/40 sm:px-10">
        <span className="flex items-center gap-2"><MonitorSmartphone size={13} /> Customer display · updates automatically</span>
        <span>Demo data · no live payments</span>
      </footer>
    </div>
  );
}

function ActiveOrder({ order }: { order: Order }) {
  const stepIndex = Math.max(0, STEPS.findIndex((s) => s.key === order.prepStatus));
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      className="mx-auto max-w-5xl"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-white/50">Now serving</p>
          <h1 className="font-display text-5xl leading-none sm:text-6xl">{order.number}</h1>
          <p className="mt-2 text-white/70">{order.tableLabel ?? order.type.replace('_', ' ').toLowerCase()} · {order.customerName ?? 'Walk-in guest'}</p>
        </div>
        <div className="rounded-2xl bg-white/10 px-5 py-3 text-right">
          <p className="text-[10px] uppercase tracking-wide text-white/50">Order total</p>
          <p className="font-display text-3xl">{money(order.totals.total)}</p>
        </div>
      </div>

      <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-honey"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = i < stepIndex;
          const current = i === stepIndex;
          return (
            <li
              key={step.key}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors ${
                current ? 'border-honey bg-honey/15' : done ? 'border-sage/50 bg-sage/10' : 'border-white/10 bg-white/5'
              }`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${current ? 'bg-honey text-espresso' : done ? 'bg-sage text-white' : 'bg-white/10 text-white/60'}`}>
                <Icon size={19} />
              </span>
              <span>
                <span className="block text-sm font-semibold">{step.label}</span>
                <span className="block text-xs text-white/55">{step.blurb}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center gap-2 text-white/60">
            <Clock3 size={15} />
            <span className="text-xs font-semibold uppercase tracking-wide">Your items</span>
          </div>
          <ul className="divide-y divide-white/10">
            {order.lines.map((line) => (
              <li key={line.lineId} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-lg font-medium">{line.quantity}× {line.name}{line.sizeName ? ` · ${line.sizeName}` : ''}</p>
                  {line.addons.length > 0 && <p className="text-xs text-white/50">+ {line.addons.map((a) => a.name).join(', ')}</p>}
                  {line.notes && <p className="text-xs italic text-white/40">{line.notes}</p>}
                </div>
                <span className="shrink-0 tabular-nums text-white/70">{money(line.unitPrice * line.quantity)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-white/60">Please keep this screen in view.</p>
          <p className="mt-3 font-display text-2xl">Thank you for your patience.</p>
          <p className="mt-2 text-xs text-white/45">Your order will be brought to you when it's ready.</p>
        </section>
      </div>
    </motion.div>
  );
}

function Idle({
  products,
  categoryName,
  greeting,
}: {
  products: { id: string; name: string; price: number; image: string; categoryId: string }[];
  categoryName: (id: string) => string | undefined;
  greeting: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto grid max-w-6xl items-center gap-10 py-6 lg:grid-cols-2"
    >
      <div>
        <p className="eyebrow text-white/50">Welcome</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.05] sm:text-6xl">
          Good food.<br />Good company.
        </h1>
        <p className="mt-5 max-w-md text-white/65">{greeting}</p>
        <p className="mt-3 max-w-md text-sm text-white/45">Place your order at the counter — your ticket number and progress will appear here.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <ProductImage src={p.image} alt={p.name} category={categoryName(p.categoryId)} className="h-28 w-full" rounded="rounded-none" />
            <div className="p-3">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="text-xs text-white/55">{money(p.price)}</p>
            </div>
          </div>
        ))}
        {!products.length && <p className="col-span-full text-white/50">Our menu is being prepared.</p>}
      </div>
    </motion.div>
  );
}
