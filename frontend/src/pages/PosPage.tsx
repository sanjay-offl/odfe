import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CircleDollarSign, Clock3, Minus, Pause, Pencil, Plus, ShoppingBag, Star, Tag, Trash2, UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { CartLine, Order, Product } from '../types';
import type { Discount } from '../lib/pricing';
import { computeTotals, couponToDiscount, lineTotal } from '../lib/pricing';
import { cartCount, useCart } from '../store/cart';
import { useDb } from '../services/db';
import { useSettings } from '../hooks/useSettings';
import { money } from '../lib/format';
import { ProductImage, PopularStar } from '../components/ui/display';
import { Button, Chip, FormField, Input, SegmentedControl } from '../components/ui/primitives';
import { ConfirmDialog, EmptyState } from '../components/ui/feedback';
import { Modal } from '../components/ui/Modal';
import { CustomizeDialog, type CustomizeResult } from '../components/pos/CustomizeDialog';
import { CustomerSelector } from '../components/pos/CustomerSelector';
import { PaymentDialog } from '../components/pos/PaymentDialog';

function cartSignature(lines: CartLine[], discount?: Discount) {
  return lines.map((l) => `${l.lineId}:${l.quantity}:${l.unitPrice}`).join('|') + `#${discount?.type ?? ''}${discount?.value ?? ''}${discount?.code ?? ''}`;
}

export function PosPage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const products = useDb((s) => s.products);
  const categories = useDb((s) => s.categories);
  const tables = useDb((s) => s.tables);
  const coupons = useDb((s) => s.coupons);

  const cart = useCart();
  const { lines, orderType, tableId, customer, discount, notes, held } = cart;

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [customize, setCustomize] = useState<{ product: Product; editing?: CartLine } | undefined>();
  const [showTables, setShowTables] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showHold, setShowHold] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [holdLabel, setHoldLabel] = useState('');

  const activeCategories = categories.filter((c) => c.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const table = tables.find((t) => t.id === tableId);
  const tableLabel = orderType === 'DINE_IN' ? (table ? `Table ${table.number}` : 'Select table') : orderType === 'TAKEAWAY' ? 'Takeaway' : 'Delivery';

  const totals = useMemo(
    () => computeTotals({ lines, discount, taxRate: settings.taxRate, serviceChargeEnabled: settings.serviceChargeEnabled, serviceChargeRate: settings.serviceChargeRate }),
    [lines, discount, settings],
  );
  const signature = cartSignature(lines, discount);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (p.archived) return false;
      if (categoryId === 'popular' && !p.popular) return false;
      if (categoryId !== 'all' && categoryId !== 'popular' && p.categoryId !== categoryId) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, categoryId, query]);

  const inStock = (p: Product) => p.available && !(p.trackStock && (p.stockQty ?? 0) <= 0);

  const onProductClick = (product: Product) => {
    if (!inStock(product)) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    if (product.sizes.length > 0 || product.addons.length > 0) {
      setCustomize({ product });
      return;
    }
    cart.addLine(product);
    toast.success(`${product.name} added`, { id: product.id });
  };

  const confirmCustomize = (result: CustomizeResult) => {
    if (!customize) return;
    if (customize.editing) {
      cart.updateLine(customize.editing.lineId, {
        sizeId: result.sizeId,
        sizeName: customize.product.sizes.find((s) => s.id === result.sizeId)?.name,
        sizePrice: customize.product.sizes.find((s) => s.id === result.sizeId)?.priceDelta,
        addons: result.addons,
        notes: result.notes?.trim() || undefined,
        quantity: result.quantity,
        unitPrice: computeUnit(customize.product, result.sizeId, result.addons),
      });
      toast.success('Item updated');
    } else {
      cart.addLine(customize.product, { sizeId: result.sizeId, addons: result.addons, notes: result.notes, quantity: result.quantity });
      toast.success(`${customize.product.name} added`, { id: customize.product.id });
    }
  };

  const startPayment = () => {
    if (!lines.length) return;
    if (orderType === 'DINE_IN' && !tableId) {
      setShowTables(true);
      toast.error('Choose a table to continue');
      return;
    }
    setShowPayment(true);
  };

  return (
    <div className="lg:grid lg:grid-cols-[1fr_384px] lg:gap-5">
      {/* LEFT: menu */}
      <section className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-white/80 px-3 focus-within:border-caramel focus-within:ring-4 focus-within:ring-caramel/10">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9b897b" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-faint" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the menu…" aria-label="Search menu" />
            {query && <button onClick={() => setQuery('')} aria-label="Clear search" className="text-faint hover:text-roast">✕</button>}
          </div>
          <SegmentedControl
            value={orderType}
            onChange={(v) => cart.setOrderType(v)}
            options={[{ value: 'DINE_IN', label: 'Dine-in' }, { value: 'TAKEAWAY', label: 'Takeaway' }, { value: 'DELIVERY', label: 'Delivery' }]}
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <Chip active={categoryId === 'all'} onClick={() => setCategoryId('all')}>All</Chip>
          <Chip active={categoryId === 'popular'} onClick={() => setCategoryId('popular')}><Star size={12} /> Popular</Chip>
          {activeCategories.map((c) => (
            <Chip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} /> {c.name}
            </Chip>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const available = inStock(p);
            return (
              <button
                key={p.id}
                onClick={() => onProductClick(p)}
                disabled={!available}
                className={`group card relative overflow-hidden p-3 text-left transition-all hover:-translate-y-1 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 ${available ? '' : 'grayscale'}`}
              >
                <div className="relative">
                  <ProductImage src={p.image} alt={p.name} category={categories.find((c) => c.id === p.categoryId)?.name} className="h-28 w-full" />
                  {p.popular && available && <span className="absolute left-2 top-2 rounded-full bg-white/90 p-1 shadow-card"><PopularStar /></span>}
                  {p.dietary && (
                    <span className={`absolute right-2 top-2 h-4 w-4 rounded-sm border-2 bg-white ${p.dietary === 'NON_VEG' ? 'border-brick' : 'border-sage'}`} title={p.dietary} />
                  )}
                  {!available && <span className="absolute inset-0 grid place-items-center rounded-xl bg-espresso/55 text-xs font-bold uppercase tracking-wide text-white">Out of stock</span>}
                </div>
                <div className="mt-2.5">
                  <strong className="block truncate text-sm text-roast">{p.name}</strong>
                  <span className="mt-0.5 line-clamp-2 min-h-[30px] text-[11px] leading-tight text-muted">{p.description}</span>
                  <div className="mt-2 flex items-center justify-between">
                    <b className="text-sm text-caramel-dark">{money(p.price)}</b>
                    <span className="flex items-center gap-1 text-[10px] text-faint"><Clock3 size={11} />{p.prepMinutes}m</span>
                  </div>
                </div>
                <span className="absolute bottom-3 right-3 grid h-7 w-7 translate-y-1 place-items-center rounded-full bg-sand text-caramel opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100"><Plus size={15} /></span>
              </button>
            );
          })}
        </div>
        {!filtered.length && (
          <EmptyState icon={<ShoppingBag size={26} />} title="No menu items match" description="Try another category or clear your search." action={<Button variant="secondary" onClick={() => { setQuery(''); setCategoryId('all'); }}>Reset filters</Button>} />
        )}
      </section>

      {/* RIGHT: cart */}
      <aside className="mt-5 lg:mt-0">
        <div className="card flex flex-col lg:sticky lg:top-[84px] lg:max-h-[calc(100vh-104px)]">
          <div className="flex items-start justify-between gap-3 border-b border-line/70 p-4">
            <div>
              <p className="eyebrow">Current order</p>
              <h2 className="text-xl font-semibold">{tableLabel}</h2>
            </div>
            <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-muted">{cartCount(lines)} items</span>
          </div>

          <div className="flex flex-wrap gap-1.5 border-b border-line/70 px-4 py-2.5">
            {orderType === 'DINE_IN' && (
              <Button size="sm" variant="secondary" icon={<ShoppingBag size={14} />} onClick={() => setShowTables(true)}>
                {table ? `Table ${table.number}` : 'Choose table'}
              </Button>
            )}
            <Button size="sm" variant="secondary" icon={<UserRound size={14} />} onClick={() => setShowCustomer(true)}>
              {customer ? customer.name.split(' ')[0] : 'Guest'}
            </Button>
            <Button size="sm" variant="secondary" icon={<Tag size={14} />} onClick={() => setShowDiscount(true)}>
              {discount ? (discount.code ?? 'Discount') : 'Discount'}
            </Button>
            {held.length > 0 && (
              <Button size="sm" variant="secondary" icon={<Pause size={14} />} onClick={() => setShowHeld(true)}>
                Held ({held.length})
              </Button>
            )}
          </div>

          <div className="min-h-[120px] flex-1 overflow-y-auto px-4">
            {lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted">
                <ShoppingBag size={28} />
                <strong className="text-roast">Your order is empty</strong>
                <span className="text-xs">Tap a menu item to get started</span>
              </div>
            ) : (
              <ul className="divide-y divide-line/60">
                {lines.map((line) => (
                  <li key={line.lineId} className="flex gap-3 py-3">
                    <ProductImage src={line.image} alt={line.name} className="h-12 w-12 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-roast">{line.name}</p>
                          <p className="text-[11px] text-muted">
                            {line.sizeName ? `${line.sizeName} · ` : ''}{money(line.unitPrice)} each
                          </p>
                          {line.addons.length > 0 && <p className="text-[11px] text-faint">+ {line.addons.map((a) => a.name).join(', ')}</p>}
                          {line.notes && <p className="text-[11px] italic text-faint">{line.notes}</p>}
                        </div>
                        <div className="flex shrink-0 gap-0.5">
                          <button className="grid h-7 w-7 place-items-center rounded-lg text-faint hover:bg-sand hover:text-roast" onClick={() => { const p = products.find((x) => x.id === line.productId); if (p) setCustomize({ product: p, editing: line }); }} aria-label={`Edit ${line.name}`}><Pencil size={13} /></button>
                          <button className="grid h-7 w-7 place-items-center rounded-lg text-faint hover:bg-brick-soft hover:text-brick" onClick={() => cart.removeLine(line.lineId)} aria-label={`Remove ${line.name}`}><Trash2 size={13} /></button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1 rounded-lg bg-sand p-0.5">
                          <button className="grid h-7 w-7 place-items-center rounded-md text-caramel hover:bg-white" onClick={() => cart.setQuantity(line.lineId, line.quantity - 1)} aria-label="Decrease"><Minus size={14} /></button>
                          <span className="w-6 text-center text-xs font-semibold tabular-nums">{line.quantity}</span>
                          <button className="grid h-7 w-7 place-items-center rounded-md text-caramel hover:bg-white" onClick={() => cart.setQuantity(line.lineId, line.quantity + 1)} aria-label="Increase"><Plus size={14} /></button>
                        </div>
                        <b className="text-sm tabular-nums text-roast">{money(lineTotal(line))}</b>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-line/70 p-4">
            <FormField label="Order note">
              <Input value={notes} onChange={(e) => cart.setNotes(e.target.value)} placeholder="e.g. serve together, birthday" />
            </FormField>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted"><span>Subtotal</span><span className="tabular-nums">{money(totals.subtotal)}</span></div>
              {totals.discount > 0 && <div className="flex justify-between text-sage"><span>Discount {discount?.code ? `(${discount.code})` : ''}</span><span className="tabular-nums">-{money(totals.discount)}</span></div>}
              <div className="flex justify-between text-muted"><span>Tax ({(settings.taxRate * 100).toFixed(1)}%)</span><span className="tabular-nums">{money(totals.tax)}</span></div>
              {totals.serviceCharge > 0 && <div className="flex justify-between text-muted"><span>Service ({(settings.serviceChargeRate * 100).toFixed(0)}%)</span><span className="tabular-nums">{money(totals.serviceCharge)}</span></div>}
              <div className="flex justify-between border-t border-line/70 pt-2 text-base font-bold"><span>Total</span><span className="tabular-nums">{money(totals.total)}</span></div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" icon={<Pause size={14} />} disabled={!lines.length} onClick={() => setShowHold(true)}>Hold</Button>
              <Button variant="secondary" size="sm" icon={<Trash2 size={14} />} disabled={!lines.length} onClick={() => setShowClear(true)}>Clear</Button>
            </div>
            <Button full size="lg" className="mt-2" icon={<CircleDollarSign size={18} />} disabled={!lines.length} onClick={startPayment}>
              Charge {money(totals.total)}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-line bg-cream/95 p-3 backdrop-blur lg:hidden">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wide text-muted">{cartCount(lines)} items</p>
          <p className="text-lg font-bold">{money(totals.total)}</p>
        </div>
        <Button size="lg" disabled={!lines.length} onClick={startPayment}>Charge</Button>
      </div>
      <div className="h-16 lg:hidden" />

      {/* Dialogs */}
      {customize && (
        <CustomizeDialog
          key={customize.editing?.lineId ?? customize.product.id}
          product={customize.product}
          editing={customize.editing}
          open
          onClose={() => setCustomize(undefined)}
          onAdd={confirmCustomize}
        />
      )}

      <TablePicker
        open={showTables}
        onClose={() => setShowTables(false)}
        currentTableId={tableId}
        onSelect={(id, number) => { cart.setTable(id); toast.success(`Table ${number} selected`); }}
      />

      <CustomerSelector open={showCustomer} onClose={() => setShowCustomer(false)} selected={customer} onSelect={(c) => { cart.setCustomer(c); if (c) toast.success(`${c.name} attached`); }} />

      <DiscountDialog
        open={showDiscount}
        onClose={() => setShowDiscount(false)}
        subtotal={totals.subtotal}
        applied={discount}
        coupons={coupons}
        onApply={(d) => { cart.setDiscount(d); toast.success('Discount applied'); setShowDiscount(false); }}
        onRemove={() => { cart.setDiscount(undefined); toast.success('Discount removed'); setShowDiscount(false); }}
      />

      <Modal
        open={showHold}
        onClose={() => setShowHold(false)}
        title="Hold this order"
        subtitle="Park the cart and start a new order. You can resume it later."
        size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowHold(false)}>Cancel</Button><Button onClick={() => { cart.hold(holdLabel); setHoldLabel(''); setShowHold(false); toast.success('Order held'); }}>Hold order</Button></>}
      >
        <FormField label="Label"><Input value={holdLabel} onChange={(e) => setHoldLabel(e.target.value)} placeholder="e.g. Table 4 – waiting for guest" autoFocus /></FormField>
      </Modal>

      <Modal
        open={showHeld}
        onClose={() => setShowHeld(false)}
        title="Held orders"
        subtitle="Resume a parked order back into the cart."
        size="md"
      >
        <ul className="space-y-2">
          {held.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3">
              <div>
                <p className="text-sm font-semibold text-roast">{h.label}</p>
                <p className="text-xs text-muted">{cartCount(h.lines)} items · {money(computeTotals({ lines: h.lines, taxRate: settings.taxRate, serviceChargeEnabled: settings.serviceChargeEnabled, serviceChargeRate: settings.serviceChargeRate }).total)}</p>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" onClick={() => { cart.resume(h.id); setShowHeld(false); toast.success('Order resumed'); }}>Resume</Button>
                <Button size="sm" variant="ghost" onClick={() => cart.deleteHeld(h.id)} aria-label="Delete hold"><Trash2 size={15} /></Button>
              </div>
            </li>
          ))}
          {!held.length && <EmptyState compact title="No held orders" />}
        </ul>
      </Modal>

      <ConfirmDialog
        open={showClear}
        onClose={() => setShowClear(false)}
        title="Clear current order?"
        message="This removes all items from the cart. It cannot be undone."
        confirmLabel="Clear order"
        onConfirm={() => { cart.clear(); setShowClear(false); toast.success('Order cleared'); }}
      />

      <PaymentDialog
        open={showPayment}
        onClose={() => setShowPayment(false)}
        settings={settings}
        lines={lines}
        discount={discount}
        orderType={orderType}
        tableId={tableId}
        tableLabel={tableLabel}
        customer={customer}
        notes={notes}
        idempotencyKey={signature}
        onOrderCreated={(order: Order) => toast.success(`${order.number} sent to kitchen`)}
        onNewOrder={() => { cart.clear(); }}
        onViewOrder={() => { setShowPayment(false); navigate('/orders'); }}
      />
    </div>
  );
}

function computeUnit(product: Product, sizeId: string | undefined, addons: { price: number }[]): number {
  const size = product.sizes.find((s) => s.id === sizeId);
  return Math.round((product.price + (size?.priceDelta ?? 0) + addons.reduce((s, a) => s + a.price, 0)) * 100) / 100;
}

function TablePicker({
  open, onClose, currentTableId, onSelect,
}: {
  open: boolean;
  onClose: () => void;
  currentTableId?: string;
  onSelect: (id: string, number: number) => void;
}) {
  const tables = useDb((s) => s.tables);
  const sections = [...new Set(tables.map((t) => t.section))];
  return (
    <Modal open={open} onClose={onClose} eyebrow="Floor plan" title="Choose a table" subtitle="Occupied tables cannot be selected." size="lg">
      {sections.map((section) => (
        <div key={section} className="mb-5">
          <p className="eyebrow mb-2">{section}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {tables.filter((t) => t.section === section).sort((a, b) => a.number - b.number).map((t) => {
              const disabled = t.status === 'OCCUPIED' || t.status === 'CLEANING';
              const isCurrent = t.id === currentTableId;
              return (
                <button
                  key={t.id}
                  disabled={disabled}
                  onClick={() => { onSelect(t.id, t.number); onClose(); }}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    isCurrent ? 'border-caramel bg-[#fbeee0]' : disabled ? 'cursor-not-allowed border-line bg-sand text-faint' : 'border-line bg-white hover:border-caramel hover:bg-[#fff8ef]'
                  }`}
                >
                  <strong className="block text-lg">{t.number}</strong>
                  <span className="text-[10px] uppercase tracking-wide text-muted">{t.status.replace('_', ' ').toLowerCase()}</span>
                  <span className="mt-0.5 block text-[10px] text-muted">{t.capacity} seats</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </Modal>
  );
}

function DiscountDialog({
  open, onClose, subtotal, applied, coupons, onApply, onRemove,
}: {
  open: boolean;
  onClose: () => void;
  subtotal: number;
  applied?: Discount;
  coupons: import('../types').Coupon[];
  onApply: (discount: Discount) => void;
  onRemove: () => void;
}) {
  const [mode, setMode] = useState<'coupon' | 'manual'>('coupon');
  const [type, setType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();

  const applyManual = () => {
    const num = Number(value);
    if (!num || num <= 0) return setError('Enter a discount greater than zero.');
    if (type === 'PERCENT' && num > 90) return setError('Percentage discount cannot exceed 90%.');
    if (type === 'FLAT' && num > subtotal) return setError('Flat discount cannot exceed the subtotal.');
    onApply({ type, value: num });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Discounts"
      title="Apply a discount"
      size="md"
      footer={applied ? <><Button variant="ghost" onClick={onRemove}>Remove discount</Button><Button variant="secondary" onClick={onClose}>Close</Button></> : <Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <div className="mb-4 inline-flex rounded-xl bg-sand p-1">
        <button className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${mode === 'coupon' ? 'bg-white shadow-card' : 'text-muted'}`} onClick={() => setMode('coupon')}>Coupons</button>
        <button className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${mode === 'manual' ? 'bg-white shadow-card' : 'text-muted'}`} onClick={() => setMode('manual')}>Manual</button>
      </div>

      {applied && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-sage-soft px-3.5 py-2.5 text-sm text-[#4f7655]">
          <span>Applied: {applied.code ?? `${applied.value}${applied.type === 'PERCENT' ? '%' : ' off'}`}</span>
          <button className="font-semibold underline" onClick={onRemove}>Remove</button>
        </div>
      )}

      {mode === 'coupon' ? (
        <ul className="space-y-2">
          {coupons.filter((c) => c.active).map((c) => {
            const eligible = subtotal >= c.minSubtotal;
            return (
              <li key={c.code} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3">
                <div>
                  <p className="text-sm font-semibold text-roast">{c.code}</p>
                  <p className="text-xs text-muted">{c.label}{!eligible ? ` · needs ${money(c.minSubtotal)}+` : ''}</p>
                </div>
                <Button size="sm" disabled={!eligible} onClick={() => { const d = couponToDiscount(c, subtotal); if (d) onApply(d); }}>Apply</Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Chip active={type === 'PERCENT'} onClick={() => setType('PERCENT')}>Percentage</Chip>
            <Chip active={type === 'FLAT'} onClick={() => setType('FLAT')}>Flat amount</Chip>
          </div>
          <FormField label={type === 'PERCENT' ? 'Percent off' : 'Amount off'} error={error}>
            <Input type="number" min={0} value={value} onChange={(e) => { setValue(e.target.value); setError(undefined); }} placeholder={type === 'PERCENT' ? '10' : '50'} />
          </FormField>
          <Button full onClick={applyManual}>Apply discount</Button>
        </div>
      )}
    </Modal>
  );
}
