import type { Order, Settings } from '../../types';
import { formatDateTime, money } from '../../lib/format';
import type { PaymentMethod } from '../../types';

const METHOD_LABEL: Record<PaymentMethod, string> = { CASH: 'Cash', CARD: 'Card', UPI: 'UPI', WALLET: 'Wallet' };

export function ReceiptView({ order, settings }: { order: Order; settings: Settings }) {
  return (
    <div className="print-area mx-auto max-w-sm rounded-xl border border-line bg-white p-5 font-mono text-[12px] leading-relaxed text-espresso">
      <div className="text-center">
        <p className="text-sm font-bold tracking-wide">{settings.cafeName}</p>
        <p className="text-[11px] text-muted">{settings.tagline}</p>
        <p className="mt-1 text-[11px] text-muted">{settings.receiptHeader}</p>
      </div>
      <div className="my-3 border-t border-dashed border-line" />
      <div className="flex justify-between">
        <span>Order</span>
        <span className="font-bold">{order.number}</span>
      </div>
      <div className="flex justify-between text-muted">
        <span>{formatDateTime(order.createdAt)}</span>
        <span>{order.tableLabel ?? order.type.replace('_', ' ')}</span>
      </div>
      {order.customerName && <div className="flex justify-between text-muted"><span>Guest</span><span>{order.customerName}</span></div>}
      <div className="my-3 border-t border-dashed border-line" />
      <table className="w-full">
        <tbody>
          {order.lines.map((line) => (
            <tr key={line.lineId} className="align-top">
              <td className="py-0.5">{line.quantity}× {line.name}{line.sizeName ? ` (${line.sizeName})` : ''}
                {line.addons.length > 0 && <span className="block pl-3 text-[10px] text-muted">+ {line.addons.map((a) => a.name).join(', ')}</span>}
                {line.notes && <span className="block pl-3 text-[10px] italic text-muted">{line.notes}</span>}
              </td>
              <td className="py-0.5 text-right tabular-nums">{money(line.unitPrice * line.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="my-3 border-t border-dashed border-line" />
      <div className="space-y-1">
        <Row label="Subtotal" value={money(order.totals.subtotal)} />
        {order.totals.discount > 0 && <Row label={`Discount${order.discountCode ? ` (${order.discountCode})` : ''}`} value={`-${money(order.totals.discount)}`} />}
        <Row label={`Tax`} value={money(order.totals.tax)} />
        {order.totals.serviceCharge > 0 && <Row label="Service charge" value={money(order.totals.serviceCharge)} />}
      </div>
      <div className="my-3 border-t border-dashed border-line" />
      <div className="flex justify-between text-sm font-bold">
        <span>Total</span>
        <span>{money(order.totals.total)}</span>
      </div>
      {order.paymentStatus === 'PAID' && order.paymentMethod && (
        <div className="mt-1 flex justify-between text-muted">
          <span>Paid · {METHOD_LABEL[order.paymentMethod]}</span>
          <span>{order.paymentStatus}</span>
        </div>
      )}
      {order.paymentStatus === 'UNPAID' && <p className="mt-2 text-center font-bold text-brick">** UNPAID **</p>}
      {order.paymentStatus === 'REFUNDED' && <p className="mt-2 text-center font-bold text-brick">** REFUNDED **</p>}
      <div className="my-3 border-t border-dashed border-line" />
      <p className="text-center text-[10px] text-muted">{settings.receiptFooter}</p>
      <p className="mt-1 text-center text-[10px] text-muted">Demo receipt · not a tax invoice</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
