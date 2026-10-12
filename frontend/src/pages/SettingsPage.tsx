import { useEffect, useState } from 'react';
import {
  AlertTriangle, Bell, CreditCard, IndianRupee, RotateCcw, Save, Store,
} from 'lucide-react';
import type { PaymentMethod, Settings } from '../types';
import { useDb } from '../services/db';
import { useAction } from '../hooks/useAsync';
import { usePermission, useSettings } from '../hooks/useSettings';
import { resetDemoData, updateSettings } from '../services/api';
import { PageHeader, KeyValue } from '../components/ui/display';
import { Badge, Button, FormField, Input, Select, Tabs, Textarea, Toggle } from '../components/ui/primitives';
import { ConfirmDialog } from '../components/ui/feedback';
import { moneyShort } from '../lib/format';

type TabKey = 'profile' | 'taxes' | 'payments' | 'alerts' | 'danger';

export function SettingsPage() {
  const settings = useSettings();
  const hasData = useDb((s) => s.orders.length > 0);
  const canManage = usePermission('settings.manage');
  const [tab, setTab] = useState<TabKey>('profile');
  const [form, setForm] = useState<Settings>(settings);
  const [resetOpen, setResetOpen] = useState(false);

  const save = useAction(updateSettings, { success: 'Settings saved' });
  const reset = useAction(resetDemoData, { success: 'Demo data restored' });

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const patch = (partial: Partial<Settings>) => setForm((prev) => ({ ...prev, ...partial }));

  const setPayment = (id: PaymentMethod, enabled: boolean) =>
    patch({ paymentMethods: form.paymentMethods.map((m) => (m.id === id ? { ...m, enabled } : m)) });

  const dirty = JSON.stringify(form) !== JSON.stringify(settings);

  const commit = async () => {
    if (form.taxRate < 0 || form.taxRate > 1) return;
    const res = await save.run(form);
    if (res.ok) setForm(res.data);
  };

  const confirmReset = async () => {
    const res = await reset.run();
    if (res.ok) setResetOpen(false);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Cafe profile, tax, payment methods and alerts. Changes apply across the workspace."
        actions={
          <Button icon={<Save size={16} />} onClick={commit} loading={save.pending} disabled={!canManage || !dirty}>
            {dirty ? 'Save changes' : 'Saved'}
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-5"
        tabs={[
          { value: 'profile', label: 'Cafe profile' },
          { value: 'taxes', label: 'Tax & charges' },
          { value: 'payments', label: 'Payments' },
          { value: 'alerts', label: 'Alerts' },
          { value: 'danger', label: 'Danger zone' },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {tab === 'profile' && (
            <section className="card p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><Store size={18} className="text-caramel" /> Cafe profile</h2>
              <p className="mt-1 text-sm text-muted">Shown on receipts, the app header and the customer display.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FormField label="Cafe name" className="sm:col-span-2">
                  <Input value={form.cafeName} onChange={(e) => patch({ cafeName: e.target.value })} disabled={!canManage} />
                </FormField>
                <FormField label="Tagline" className="sm:col-span-2">
                  <Input value={form.tagline} onChange={(e) => patch({ tagline: e.target.value })} disabled={!canManage} />
                </FormField>
                <FormField label="Currency">
                  <Select value={form.currency} onChange={(e) => patch({ currency: e.target.value })} disabled={!canManage}>
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">Pound Sterling (£)</option>
                    <option value="AED">UAE Dirham (د.إ)</option>
                  </Select>
                </FormField>
                <FormField label="Locale">
                  <Select value={form.locale} onChange={(e) => patch({ locale: e.target.value })} disabled={!canManage}>
                    <option value="en-IN">English (India)</option>
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="en-AE">English (UAE)</option>
                  </Select>
                </FormField>
                <FormField label="Order prefix" hint="Prepended to every new order number.">
                  <Input value={form.orderPrefix} onChange={(e) => patch({ orderPrefix: e.target.value.toUpperCase().slice(0, 4) })} disabled={!canManage} />
                </FormField>
                <FormField label="Next order number">
                  <Input type="number" min={1} value={form.nextOrderNumber} onChange={(e) => patch({ nextOrderNumber: Math.max(1, Number(e.target.value) || 1) })} disabled={!canManage} />
                </FormField>
                <FormField label="Receipt header" className="sm:col-span-2">
                  <Textarea value={form.receiptHeader} onChange={(e) => patch({ receiptHeader: e.target.value })} disabled={!canManage} />
                </FormField>
                <FormField label="Receipt footer" className="sm:col-span-2">
                  <Textarea value={form.receiptFooter} onChange={(e) => patch({ receiptFooter: e.target.value })} disabled={!canManage} />
                </FormField>
              </div>
            </section>
          )}

          {tab === 'taxes' && (
            <section className="card p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><IndianRupee size={18} className="text-caramel" /> Tax & charges</h2>
              <p className="mt-1 text-sm text-muted">Rates apply to the discounted subtotal (net).</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FormField label="Tax rate (%)" hint="Default GST in demo data is 5%.">
                  <Input
                    type="number" min={0} max={100} step="0.1"
                    value={toPercent(form.taxRate)}
                    onChange={(e) => patch({ taxRate: fromPercent(e.target.value) })}
                    disabled={!canManage}
                  />
                </FormField>
                <FormField label="Service charge (%)">
                  <Input
                    type="number" min={0} max={100} step="0.1"
                    value={toPercent(form.serviceChargeRate)}
                    onChange={(e) => patch({ serviceChargeRate: fromPercent(e.target.value) })}
                    disabled={!canManage}
                  />
                </FormField>
                <label className="flex items-center justify-between rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-roast sm:col-span-2">
                  <span>
                    <span className="block font-medium">Enable service charge</span>
                    <span className="block text-xs text-muted">Added as a separate line on orders and receipts.</span>
                  </span>
                  <Toggle checked={form.serviceChargeEnabled} onChange={(v) => patch({ serviceChargeEnabled: v })} disabled={!canManage} label="Enable service charge" />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-roast sm:col-span-2">
                  <span>
                    <span className="block font-medium">Tax-inclusive pricing</span>
                    <span className="block text-xs text-muted">When enabled, menu prices are treated as already including tax.</span>
                  </span>
                  <Toggle checked={form.taxInclusive} onChange={(v) => patch({ taxInclusive: v })} disabled={!canManage} label="Tax inclusive" />
                </label>
              </div>
              <div className="mt-4 rounded-xl bg-sand/60 p-3.5 text-sm">
                <p className="font-semibold text-roast">Worked example · {moneyShort(1000)} order</p>
                <KeyValue label={`Tax (${toPercent(form.taxRate)}%)`} value={percentLabel(form.taxRate)} />
                <KeyValue label={`Service (${toPercent(form.serviceChargeRate)}%)`} value={form.serviceChargeEnabled ? percentLabel(form.serviceChargeRate) : 'Disabled'} />
              </div>
            </section>
          )}

          {tab === 'payments' && (
            <section className="card p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><CreditCard size={18} className="text-caramel" /> Payment methods</h2>
              <p className="mt-1 text-sm text-muted">Only enabled methods appear at checkout.</p>
              <ul className="mt-4 space-y-2">
                {form.paymentMethods.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-roast">
                        {m.label}
                        {m.enabled ? <Badge tone="green">Active</Badge> : <Badge tone="neutral">Off</Badge>}
                      </p>
                      <p className="text-xs text-muted">{methodHint(m.id)}</p>
                    </div>
                    <Toggle checked={m.enabled} onChange={(v) => setPayment(m.id, v)} disabled={!canManage} label={`Enable ${m.label}`} />
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] text-faint">Demo only: card and UPI authorisation is simulated; no real payment is captured.</p>
            </section>
          )}

          {tab === 'alerts' && (
            <section className="card p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><Bell size={18} className="text-caramel" /> Alerts & printing</h2>
              <p className="mt-1 text-sm text-muted">Choose what the workspace nudges you about.</p>
              <ul className="mt-4 space-y-2">
                <AlertRow label="Low-stock alerts" description="Flag ingredients at or below their threshold." checked={form.lowStockAlerts} onChange={(v) => patch({ lowStockAlerts: v })} disabled={!canManage} />
                <AlertRow label="Expiry alerts" description="Warn when ingredients are close to expiry." checked={form.expiryAlerts} onChange={(v) => patch({ expiryAlerts: v })} disabled={!canManage} />
                <AlertRow label="Sound alerts" description="Play a chime for new kitchen tickets." checked={form.soundAlerts} onChange={(v) => patch({ soundAlerts: v })} disabled={!canManage} />
                <AlertRow label="Auto-print receipts" description="Send a receipt to the printer after each payment." checked={form.autoPrintReceipt} onChange={(v) => patch({ autoPrintReceipt: v })} disabled={!canManage} />
              </ul>
            </section>
          )}

          {tab === 'danger' && (
            <section className="card border-brick/30 p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-brick"><AlertTriangle size={18} /> Danger zone</h2>
              <p className="mt-1 text-sm text-muted">These actions affect the in-browser demo database only.</p>
              <div className="mt-5 flex flex-col gap-3 rounded-xl border border-brick/25 bg-brick-soft/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-roast">Reset demo data</p>
                  <p className="text-xs text-muted">Restore the original sample menu, orders, customers and stock. Your changes in this browser will be lost.</p>
                </div>
                <Button variant="danger" icon={<RotateCcw size={16} />} onClick={() => setResetOpen(true)} disabled={!canManage}>Reset data</Button>
              </div>
            </section>
          )}
        </div>

        <aside className="card h-fit p-5">
          <p className="eyebrow mb-1">Preview</p>
          <h3 className="text-lg font-semibold">Receipt snapshot</h3>
          <div className="mt-4 rounded-xl border border-dashed border-line bg-white p-4 font-mono text-[11px] leading-relaxed text-espresso">
            <p className="text-center text-sm font-bold tracking-wide">{form.cafeName}</p>
            <p className="text-center text-muted">{form.tagline}</p>
            <p className="mt-1 text-center text-muted">{form.receiptHeader}</p>
            <div className="my-2 border-t border-dashed border-line" />
            <div className="flex justify-between"><span>Order</span><span className="font-bold">{form.orderPrefix}{form.nextOrderNumber}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-muted">Sample latte</span><span>{moneyShort(200)}</span></div>
            <div className="my-2 border-t border-dashed border-line" />
            <div className="flex justify-between text-sm font-bold"><span>Total</span><span>{moneyShort(200)}</span></div>
            <div className="my-2 border-t border-dashed border-line" />
            <p className="text-center text-muted">{form.receiptFooter}</p>
          </div>
          <p className="mt-4 text-[11px] text-faint">Currency {form.currency} · locale {form.locale}{hasData ? '' : ' · no orders yet'}.</p>
          {!canManage && <p className="mt-2 text-[11px] text-brick">You have read-only access to settings.</p>}
        </aside>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset demo data?"
        message="This replaces all current demo records with the original seed data. It cannot be undone."
        confirmLabel="Reset everything"
        loading={reset.pending}
        onConfirm={confirmReset}
      />
    </div>
  );
}

function toPercent(fraction: number): string {
  return String(Math.round(fraction * 1000) / 10);
}

function fromPercent(value: string): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(1, Math.max(0, num / 100));
}

function percentLabel(fraction: number): string {
  return `${toPercent(fraction)}%`;
}

function methodHint(id: PaymentMethod): string {
  switch (id) {
    case 'CASH': return 'Cash accepted at the counter, with change calculation.';
    case 'CARD': return 'Credit and debit cards via the terminal.';
    case 'UPI': return 'Scan-to-pay QR for UPI apps.';
    case 'WALLET': return 'Stored value / loyalty wallet.';
  }
}

function AlertRow({ label, description, checked, onChange, disabled }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-roast">{label}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} label={label} />
    </li>
  );
}
