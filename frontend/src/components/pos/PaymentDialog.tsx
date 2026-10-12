import { useMemo, useState } from 'react';
import { Banknote, CheckCircle2, CreditCard, Printer, QrCode, RefreshCw, Wallet, XCircle } from 'lucide-react';
import type { CartLine, Customer, Order, OrderType, PaymentMethod, Settings } from '../../types';
import type { Discount } from '../../lib/pricing';
import { cashChange, computeTotals } from '../../lib/pricing';
import { money } from '../../lib/format';
import { Modal } from '../ui/Modal';
import { Button, Input } from '../ui/primitives';
import { ReceiptView } from './ReceiptView';
import { checkout, processPayment } from '../../services/api';
import { errorMessage } from '../../services/errors';
import toast from 'react-hot-toast';
import { cartCount } from '../../store/cart';

const METHOD_ICON: Record<PaymentMethod, typeof Banknote> = { CASH: Banknote, CARD: CreditCard, UPI: QrCode, WALLET: Wallet };

export function PaymentDialog({
  open,
  onClose,
  settings,
  lines,
  discount,
  orderType,
  tableId,
  tableLabel,
  customer,
  notes,
  idempotencyKey,
  onOrderCreated,
  onNewOrder,
  onViewOrder,
}: {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  lines: CartLine[];
  discount?: Discount;
  orderType: OrderType;
  tableId?: string;
  tableLabel?: string;
  customer?: Customer;
  notes?: string;
  idempotencyKey: string;
  onOrderCreated: (order: Order) => void;
  onNewOrder: () => void;
  onViewOrder: (order: Order) => void;
}) {
  const enabledMethods = settings.paymentMethods.filter((m) => m.enabled);
  const [method, setMethod] = useState<PaymentMethod>(enabledMethods[0]?.id ?? 'CASH');
  const [tendered, setTendered] = useState<string>('');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [stage, setStage] = useState<'summary' | 'processing' | 'success' | 'failed'>('summary');
  const [activeOrder, setActiveOrder] = useState<Order | undefined>();
  const [change, setChange] = useState(0);
  const [error, setError] = useState<string>();

  const totals = useMemo(
    () => computeTotals({ lines, discount, taxRate: settings.taxRate, serviceChargeEnabled: settings.serviceChargeEnabled, serviceChargeRate: settings.serviceChargeRate }),
    [lines, discount, settings],
  );

  const tenderedValue = tendered === '' ? totals.total : Number(tendered);
  const changePreview = cashChange(tenderedValue, totals.total);
  const cashInsufficient = method === 'CASH' && changePreview < 0;

  const confirm = async () => {
    setError(undefined);
    setStage('processing');
    try {
      let order = activeOrder;
      if (!order) {
        order = await checkout({ type: orderType, tableId, customer: customer ?? null, lines, discount, notes, idempotencyKey });
        setActiveOrder(order);
        onOrderCreated(order); // clears the cart so a repeat click cannot duplicate
      }
      const result = await processPayment({ orderId: order.id, method, tendered: method === 'CASH' ? tenderedValue : undefined, simulateFailure });
      setActiveOrder(result.order);
      setChange(result.change);
      setStage('success');
      toast.success(`${order.number} paid · ${money(result.order.totals.total)}`);
    } catch (err) {
      setError(errorMessage(err));
      setStage('failed');
    }
  };

  const closeAll = () => {
    setStage('summary');
    setActiveOrder(undefined);
    setChange(0);
    setError(undefined);
    setTendered('');
    setSimulateFailure(false);
    onClose();
  };

  const startNewOrder = () => {
    const done = activeOrder;
    closeAll();
    onNewOrder();
    if (done) toast.success('Ready for the next order');
  };

  return (
    <Modal
      open={open}
      onClose={stage === 'processing' ? () => undefined : closeAll}
      eyebrow={stage === 'success' ? 'Payment complete' : `Checkout · ${tableLabel ?? orderType.replace('_', ' ')}`}
      title={stage === 'success' ? 'Paid in full' : stage === 'failed' ? 'Payment failed' : 'Take payment'}
      size="lg"
      footer={
        stage === 'success' ? (
          <>
            <Button variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()}>Print receipt</Button>
            <Button variant="secondary" onClick={() => activeOrder && onViewOrder(activeOrder)}>Order details</Button>
            <Button icon={<RefreshCw size={16} />} onClick={startNewOrder}>New order</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={closeAll} disabled={stage === 'processing'}>
              {activeOrder ? 'Keep order open (unpaid)' : 'Cancel'}
            </Button>
            <Button onClick={confirm} loading={stage === 'processing'} disabled={cashInsufficient}>
              {stage === 'failed' ? 'Retry payment' : `Confirm ${method} · ${money(totals.total)}`}
            </Button>
          </>
        )
      }
    >
      {stage === 'success' && activeOrder ? (
        <div>
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-sage-soft p-4">
            <CheckCircle2 className="text-sage" size={28} />
            <div>
              <p className="font-semibold text-roast">Payment recorded for {activeOrder.number}</p>
              <p className="text-sm text-muted">
                {method === 'CASH' ? `Change due: ${money(change)}` : `Paid by ${method.toLowerCase()} · ${money(activeOrder.totals.total)}`}
              </p>
            </div>
          </div>
          <ReceiptView order={activeOrder} settings={settings} />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-[1fr_256px]">
          <div>
            {stage === 'failed' && (
              <div className="mb-4 flex items-start gap-3 rounded-xl bg-brick-soft p-3.5 text-brick">
                <XCircle size={20} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">No charge was made</p>
                  <p className="text-xs">{error} The order is saved as unpaid.</p>
                </div>
              </div>
            )}

            <p className="label">Payment method</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {enabledMethods.map((m) => {
                const Icon = METHOD_ICON[m.id];
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-colors ${method === m.id ? 'border-caramel bg-[#fbeee0] text-caramel-dark' : 'border-line bg-white hover:bg-sand'}`}
                    aria-pressed={method === m.id}
                  >
                    <Icon size={19} />
                    <span className="font-semibold">{m.label}</span>
                  </button>
                );
              })}
              {!enabledMethods.length && <p className="text-sm text-muted">No payment methods are enabled. Enable one in Settings.</p>}
            </div>

            {method === 'CASH' && (
              <div className="mt-4">
                <p className="label">Cash tendered</p>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  placeholder={String(totals.total)}
                  aria-label="Cash tendered"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <QuickCash label="Exact" value={totals.total} onPick={(v) => setTendered(String(v))} />
                  {[100, 500, 1000, 2000].map((v) => (v >= totals.total ? <QuickCash key={v} label={money(v)} value={v} onPick={(n) => setTendered(String(n))} /> : null))}
                </div>
                <div className={`mt-3 flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm ${cashInsufficient ? 'bg-brick-soft text-brick' : 'bg-sand text-roast'}`}>
                  <span>{cashInsufficient ? 'Short by' : 'Change due'}</span>
                  <span className="font-semibold tabular-nums">{money(Math.abs(changePreview))}</span>
                </div>
              </div>
            )}

            {method === 'UPI' && (
              <div className="mt-4 flex items-center gap-4 rounded-xl border border-line bg-white p-4">
                <QrCode size={72} className="text-espresso" />
                <div>
                  <p className="text-sm font-semibold text-roast">Scan to pay</p>
                  <p className="text-xs text-muted">odfe.cafe@ybl · {money(totals.total)}</p>
                  <p className="mt-1 text-[11px] text-faint">Confirm once UPI shows success.</p>
                </div>
              </div>
            )}

            <label className="mt-4 flex items-start gap-2.5 rounded-xl border border-dashed border-line bg-white/60 p-3 text-xs text-muted">
              <input type="checkbox" className="mt-0.5 accent-brick" checked={simulateFailure} onChange={(e) => setSimulateFailure(e.target.checked)} />
              <span><strong className="text-roast">Demo:</strong> simulate a declined payment. The order will stay unpaid so you can test the failure &amp; retry states.</span>
            </label>
          </div>

          <aside className="rounded-xl border border-line bg-white p-4">
            <p className="eyebrow mb-2">Order summary</p>
            <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
              {lines.map((l) => (
                <li key={l.lineId} className="flex justify-between gap-2">
                  <span className="text-roast">{l.quantity}× {l.name}{l.sizeName ? ` · ${l.sizeName}` : ''}</span>
                  <span className="shrink-0 tabular-nums text-muted">{money(l.unitPrice * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-line/70 pt-3 text-sm">
              <SumRow label="Subtotal" value={money(totals.subtotal)} />
              {totals.discount > 0 && <SumRow label="Discount" value={`-${money(totals.discount)}`} />}
              <SumRow label="Tax" value={money(totals.tax)} />
              {totals.serviceCharge > 0 && <SumRow label="Service charge" value={money(totals.serviceCharge)} />}
            </div>
            <div className="mt-3 flex justify-between border-t border-line/70 pt-3 text-base font-bold">
              <span>Total</span>
              <span className="tabular-nums">{money(totals.total)}</span>
            </div>
            <p className="mt-2 text-[11px] text-faint">{cartCount(lines)} items · {customer?.name ?? 'Walk-in guest'}</p>
          </aside>
        </div>
      )}
    </Modal>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function QuickCash({ label, value, onPick }: { label: string; value: number; onPick: (v: number) => void }) {
  return (
    <button onClick={() => onPick(value)} className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold text-roast hover:bg-[#e9ddd1]">
      {label}
    </button>
  );
}
