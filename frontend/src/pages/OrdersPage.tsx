import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ban, ChefHat, Eye, Printer, ReceiptText, RotateCcw, Undo2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order, PaymentStatus, PrepStatus } from '../types';
import { useDb } from '../services/db';
import { useAction } from '../hooks/useAsync';
import { usePermission, useSettings } from '../hooks/useSettings';
import { canTransitionPrep, cancelOrder, refundOrder, updatePrepStatus } from '../services/api';
import { money, formatDateTime } from '../lib/format';
import { cartCount } from '../lib/pricing';
import { PageHeader, OrderStatusBadge, PaymentStatusBadge, Pagination, KeyValue } from '../components/ui/display';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Button, Chip, FormField, SearchInput, Textarea } from '../components/ui/primitives';
import { Modal, Drawer } from '../components/ui/Modal';
import { ReceiptView } from '../components/pos/ReceiptView';
import { EmptyState } from '../components/ui/feedback';

const PREP_FILTERS: { value: PrepStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY', label: 'Ready' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PAY_FILTERS: { value: PaymentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Any payment' },
  { value: 'PAID', label: 'Paid' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'REFUNDED', label: 'Refunded' },
];

export function OrdersPage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const orders = useDb((s) => s.orders);
  const canUpdate = usePermission('orders.updateStatus') || usePermission('kitchen.update');
  const canCancel = usePermission('orders.cancel');
  const canRefund = usePermission('orders.refund');

  const [prep, setPrep] = useState<PrepStatus | 'ALL'>('ALL');
  const [pay, setPay] = useState<PaymentStatus | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string>();
  const [showReceipt, setShowReceipt] = useState(false);
  const [reasonAction, setReasonAction] = useState<{ kind: 'cancel' | 'refund'; order: Order }>();
  const [reason, setReason] = useState('');

  const pageSize = 10;

  const advance = useAction(updatePrepStatus, { success: 'Order updated' });
  const cancel = useAction(cancelOrder, { success: 'Order cancelled' });
  const refund = useAction(refundOrder, { success: 'Refund recorded' });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...orders]
      .filter((o) => (prep === 'ALL' ? true : o.prepStatus === prep))
      .filter((o) => (pay === 'ALL' ? true : o.paymentStatus === pay))
      .filter((o) => !q || o.number.toLowerCase().includes(q) || (o.customerName ?? '').toLowerCase().includes(q) || (o.tableLabel ?? '').toLowerCase().includes(q))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [orders, prep, pay, query]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const activeOrder = orders.find((o) => o.id === selected);

  const counts = useMemo(() => ({
    total: orders.length,
    open: orders.filter((o) => o.prepStatus === 'NEW' || o.prepStatus === 'PREPARING').length,
    unpaid: orders.filter((o) => o.paymentStatus === 'UNPAID' && o.prepStatus !== 'CANCELLED').length,
    revenue: orders.filter((o) => o.paymentStatus === 'PAID').reduce((s, o) => s + o.totals.total, 0),
  }), [orders]);

  const setStatus = async (order: Order, status: PrepStatus) => {
    const res = await advance.run(order.id, status);
    if (res.ok) setSelected(res.data.id);
  };

  const confirmReason = async () => {
    if (!reasonAction) return;
    if (!reason.trim()) return toast.error('A reason is required');
    const res = reasonAction.kind === 'cancel'
      ? await cancel.run(reasonAction.order.id, reason)
      : await refund.run(reasonAction.order.id, reason);
    if (res.ok) {
      setReasonAction(undefined);
      setReason('');
      setSelected(undefined);
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'number',
      header: 'Order',
      sortValue: (o) => o.number,
      render: (o) => (
        <div>
          <p className="font-semibold text-roast">{o.number}</p>
          <p className="text-xs text-muted">{formatDateTime(o.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (o) => (
        <div>
          <p className="text-sm text-roast">{o.tableLabel ?? o.type.replace('_', ' ')}</p>
          <p className="text-xs text-muted">{cartCount(o.lines)} items</p>
        </div>
      ),
    },
    { key: 'customer', header: 'Guest', render: (o) => <span className="text-sm text-muted">{o.customerName ?? 'Walk-in'}</span> },
    { key: 'total', header: 'Total', align: 'right', sortValue: (o) => o.totals.total, render: (o) => <span className="font-semibold tabular-nums">{money(o.totals.total)}</span> },
    { key: 'payment', header: 'Payment', render: (o) => <PaymentStatusBadge status={o.paymentStatus} /> },
    { key: 'prep', header: 'Kitchen', render: (o) => <OrderStatusBadge status={o.prepStatus} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (o) => (
        <Button size="sm" variant="ghost" icon={<Eye size={15} />} onClick={(e) => { e.stopPropagation(); setSelected(o.id); }}>
          View
        </Button>
      ),
    },
  ];

  const nextStatuses = activeOrder ? (['PREPARING', 'READY', 'COMPLETED'] as PrepStatus[]).filter((s) => canTransitionPrep(activeOrder.prepStatus, s)) : [];

  return (
    <div>
      <PageHeader
        eyebrow="Service"
        title="Orders"
        description="Every ticket from first pour to final payment, with kitchen and refund controls."
        actions={<Button icon={<ReceiptText size={16} />} onClick={() => navigate('/pos')}>New order</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Total orders" value={String(counts.total)} />
        <SummaryTile label="Open in kitchen" value={String(counts.open)} />
        <SummaryTile label="Unpaid" value={String(counts.unpaid)} />
        <SummaryTile label="Paid revenue" value={money(counts.revenue)} />
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-line/70 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {PREP_FILTERS.map((f) => <Chip key={f.value} active={prep === f.value} onClick={() => { setPrep(f.value); setPage(1); }}>{f.label}</Chip>)}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-1.5">
              {PAY_FILTERS.map((f) => <Chip key={f.value} active={pay === f.value} onClick={() => { setPay(f.value); setPage(1); }}>{f.label}</Chip>)}
            </div>
            <div className="sm:w-64">
              <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search order, guest or table…" />
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={paged}
          getRowId={(o) => o.id}
          onRowClick={(o) => setSelected(o.id)}
          empty={<EmptyState compact icon={<ReceiptText size={26} />} title="No orders match" description="Adjust the filters or create a new order from the POS." />}
          footer={<Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />}
        />
      </div>

      <Drawer
        open={!!activeOrder}
        onClose={() => setSelected(undefined)}
        eyebrow={activeOrder ? `${activeOrder.type.replace('_', ' ')} · ${activeOrder.tableLabel ?? activeOrder.number}` : ''}
        title={activeOrder?.number ?? 'Order'}
        footer={activeOrder && (
          <>
            <Button variant="secondary" icon={<Printer size={16} />} onClick={() => setShowReceipt(true)}>Receipt</Button>
            {canCancel && activeOrder.prepStatus !== 'COMPLETED' && activeOrder.prepStatus !== 'CANCELLED' && (
              <Button variant="danger" icon={<Ban size={16} />} onClick={() => { setReasonAction({ kind: 'cancel', order: activeOrder }); setReason(''); }}>
                Cancel
              </Button>
            )}
            {canRefund && activeOrder.paymentStatus === 'PAID' && (
              <Button variant="danger" icon={<RotateCcw size={16} />} onClick={() => { setReasonAction({ kind: 'refund', order: activeOrder }); setReason(''); }}>
                Refund
              </Button>
            )}
          </>
        )}
      >
        {activeOrder && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={activeOrder.prepStatus} />
              <PaymentStatusBadge status={activeOrder.paymentStatus} />
              {activeOrder.paymentMethod && <span className="badge bg-sand text-roast">{activeOrder.paymentMethod}</span>}
            </div>

            <div className="rounded-xl border border-line bg-white p-3">
              <KeyValue label="Guest" value={activeOrder.customerName ?? 'Walk-in'} />
              <KeyValue label="Placed" value={formatDateTime(activeOrder.createdAt)} />
              <KeyValue label="Cashier" value={activeOrder.cashierName} />
              {activeOrder.discountCode && <KeyValue label="Discount" value={activeOrder.discountCode} />}
              {activeOrder.cancelReason && <KeyValue label="Cancel reason" value={activeOrder.cancelReason} />}
              {activeOrder.refundReason && <KeyValue label="Refund reason" value={activeOrder.refundReason} />}
            </div>

            {canUpdate && nextStatuses.length > 0 && (
              <div>
                <p className="label">Advance kitchen status</p>
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((s) => (
                    <Button key={s} size="sm" variant={s === 'COMPLETED' ? 'success' : 'secondary'} icon={<Undo2 size={14} />} loading={advance.pending} onClick={() => setStatus(activeOrder, s)}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="label flex items-center gap-1.5"><ChefHat size={14} /> Items</p>
              <ul className="divide-y divide-line/60 rounded-xl border border-line bg-white">
                {activeOrder.lines.map((l) => (
                  <li key={l.lineId} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-roast">{l.quantity}× {l.name}{l.sizeName ? ` · ${l.sizeName}` : ''}</p>
                      {l.addons.length > 0 && <p className="text-[11px] text-muted">+ {l.addons.map((a) => a.name).join(', ')}</p>}
                      {l.notes && <p className="text-[11px] italic text-faint">{l.notes}</p>}
                    </div>
                    <span className="shrink-0 text-sm tabular-nums text-muted">{money(l.unitPrice * l.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5 rounded-xl bg-sand/60 p-3 text-sm">
              <Row label="Subtotal" value={money(activeOrder.totals.subtotal)} />
              {activeOrder.totals.discount > 0 && <Row label="Discount" value={`-${money(activeOrder.totals.discount)}`} tone="sage" />}
              <Row label="Tax" value={money(activeOrder.totals.tax)} />
              {activeOrder.totals.serviceCharge > 0 && <Row label="Service charge" value={money(activeOrder.totals.serviceCharge)} />}
              <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums">{money(activeOrder.totals.total)}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        title="Receipt"
        size="md"
        footer={<Button variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()}>Print</Button>}
      >
        {activeOrder && <ReceiptView order={activeOrder} settings={settings} />}
      </Modal>

      <Modal
        open={!!reasonAction}
        onClose={() => setReasonAction(undefined)}
        title={reasonAction?.kind === 'refund' ? 'Refund order' : 'Cancel order'}
        subtitle={reasonAction ? `${reasonAction.order.number} · ${money(reasonAction.order.totals.total)}` : ''}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReasonAction(undefined)}>Back</Button>
            <Button variant="danger" loading={cancel.pending || refund.pending} onClick={confirmReason}>
              {reasonAction?.kind === 'refund' ? 'Confirm refund' : 'Confirm cancel'}
            </Button>
          </>
        }
      >
        <FormField label="Reason" required hint="Recorded against the order for your audit trail.">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={reasonAction?.kind === 'refund' ? 'e.g. guest unhappy with the dish' : 'e.g. guest left before serving'} autoFocus />
        </FormField>
      </Modal>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'sage' }) {
  return (
    <div className={`flex justify-between ${tone === 'sage' ? 'text-sage' : 'text-muted'}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
