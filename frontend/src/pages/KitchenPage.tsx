import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCheck, ChefHat, Clock3, Flame, Play, Utensils } from 'lucide-react';
import type { Order, PrepStatus } from '../types';
import { useDb } from '../services/db';
import { useAction, useClock } from '../hooks/useAsync';
import { usePermission } from '../hooks/useSettings';
import { updatePrepStatus } from '../services/api';
import { elapsed } from '../lib/format';
import { cartCount } from '../lib/pricing';
import { PageHeader } from '../components/ui/display';
import { Badge, Button, Chip } from '../components/ui/primitives';
import { EmptyState } from '../components/ui/feedback';

type ColumnKey = Extract<PrepStatus, 'NEW' | 'PREPARING' | 'READY'>;

const COLUMNS: { key: ColumnKey; label: string; icon: typeof Flame; accent: string; next?: PrepStatus; nextLabel?: string }[] = [
  { key: 'NEW', label: 'To cook', icon: Flame, accent: 'text-brick', next: 'PREPARING', nextLabel: 'Start preparing' },
  { key: 'PREPARING', label: 'Preparing', icon: Utensils, accent: 'text-caramel', next: 'READY', nextLabel: 'Mark ready' },
  { key: 'READY', label: 'Ready to serve', icon: CheckCheck, accent: 'text-sage', next: 'COMPLETED', nextLabel: 'Complete' },
];

function urgency(createdAt: string): 'calm' | 'warn' | 'late' {
  const mins = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (mins >= 12) return 'late';
  if (mins >= 6) return 'warn';
  return 'calm';
}

export function KitchenPage() {
  const orders = useDb((s) => s.orders);
  const now = useClock(30000);
  const canUpdate = usePermission('kitchen.update') || usePermission('orders.updateStatus');
  const [kitchenOnly, setKitchenOnly] = useState(true);
  const advance = useAction(updatePrepStatus, { success: 'Ticket updated' });

  const board = useMemo(() => {
    const active = orders.filter((o) => o.prepStatus === 'NEW' || o.prepStatus === 'PREPARING' || o.prepStatus === 'READY');
    return active
      .filter((o) => (kitchenOnly ? o.lines.some((l) => l.sendToKitchen) : true))
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  }, [orders, kitchenOnly]);

  const byColumn = (key: ColumnKey) => board.filter((o) => o.prepStatus === key);
  const outstanding = board.length;

  return (
    <div>
      <PageHeader
        eyebrow="Live service"
        title="Kitchen display"
        description="Tickets flow left to right. Colours warn you before a table waits too long."
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1.5 text-xs font-semibold text-[#4f7655]">
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-sage" /> Live
            </span>
            <Chip active={kitchenOnly} onClick={() => setKitchenOnly((v) => !v)}>
              <ChefHat size={12} /> Kitchen items only
            </Chip>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Badge tone={outstanding ? 'amber' : 'green'}>{outstanding} open tickets</Badge>
        <span>·</span>
        <span className="flex items-center gap-1"><Clock3 size={13} /> Updated {elapsed(new Date(now).toISOString(), now)}</span>
      </div>

      {outstanding === 0 ? (
        <div className="card">
          <EmptyState icon={<CheckCheck size={26} />} title="The pass is clear" description="No open kitchen tickets right now. New orders appear here automatically." />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const Icon = col.icon;
            const items = byColumn(col.key);
            return (
              <section key={col.key} className="rounded-2xl border border-line bg-white/50 p-3">
                <header className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Icon size={17} className={col.accent} />
                    <h2 className="text-sm font-bold uppercase tracking-wide text-roast">{col.label}</h2>
                  </div>
                  <Badge tone="neutral">{items.length}</Badge>
                </header>

                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((order) => (
                      <TicketCard
                        key={order.id}
                        order={order}
                        now={now}
                        canUpdate={canUpdate}
                        pending={advance.pending}
                        next={col.next}
                        nextLabel={col.nextLabel}
                        onAdvance={() => col.next && advance.run(order.id, col.next)}
                      />
                    ))}
                  </AnimatePresence>
                  {!items.length && <p className="rounded-xl border border-dashed border-line py-8 text-center text-xs text-faint">Nothing here</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

const TICKET_TONE: Record<'calm' | 'warn' | 'late', string> = {
  calm: 'border-line',
  warn: 'border-honey/70',
  late: 'border-brick/70',
};
const AGE_TONE: Record<'calm' | 'warn' | 'late', 'green' | 'amber' | 'red'> = { calm: 'green', warn: 'amber', late: 'red' };

function TicketCard({
  order, now, canUpdate, pending, next, nextLabel, onAdvance,
}: {
  order: Order;
  now: number;
  canUpdate: boolean;
  pending: boolean;
  next?: PrepStatus;
  nextLabel?: string;
  onAdvance: () => void;
}) {
  const level = urgency(order.createdAt);
  const kitchenLines = order.lines.filter((l) => l.sendToKitchen);
  const lines = kitchenLines.length ? kitchenLines : order.lines;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={`rounded-xl border-2 bg-white p-3 shadow-card ${TICKET_TONE[level]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-base font-bold text-roast">{order.number}</p>
          <p className="text-xs text-muted">{order.tableLabel ?? order.type.replace('_', ' ')}</p>
        </div>
        <Badge tone={AGE_TONE[level]}>{elapsed(order.createdAt, now)}</Badge>
      </div>

      <ul className="my-3 space-y-1 border-y border-line/60 py-2">
        {lines.map((l) => (
          <li key={l.lineId} className="flex items-baseline gap-2 text-sm">
            <b className="tabular-nums text-caramel">{l.quantity}×</b>
            <span className="text-roast">{l.name}{l.sizeName ? ` · ${l.sizeName}` : ''}</span>
          </li>
        ))}
        {order.notes && <li className="pt-1 text-[11px] italic text-brick">Note: {order.notes}</li>}
      </ul>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-faint">{cartCount(order.lines)} items</span>
        {canUpdate && next ? (
          <Button size="sm" variant={next === 'COMPLETED' ? 'success' : 'primary'} icon={next === 'PREPARING' ? <Play size={14} /> : next === 'COMPLETED' ? <CheckCheck size={14} /> : <CheckCheck size={14} />} loading={pending} onClick={onAdvance}>
            {nextLabel}
          </Button>
        ) : (
          <Badge tone="blue">{order.prepStatus}</Badge>
        )}
      </div>
    </motion.article>
  );
}
