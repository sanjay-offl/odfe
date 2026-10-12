import { useMemo, useState } from 'react';
import { Pencil, Phone, Plus, UserPlus, Users } from 'lucide-react';
import type { Customer } from '../types';
import { useDb } from '../services/db';
import { useAction } from '../hooks/useAsync';
import { usePermission, useSettings } from '../hooks/useSettings';
import { createCustomer, customerStats, updateCustomer } from '../services/api';
import { formatDate, initials, money, relativeTime } from '../lib/format';
import { PageHeader, ProductImage, KeyValue } from '../components/ui/display';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Badge, Button, FormField, Input, SearchInput, Textarea } from '../components/ui/primitives';
import { Modal, Drawer } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/feedback';

interface FormState { name: string; phone: string; email: string; notes: string }
const EMPTY: FormState = { name: '', phone: '', email: '', notes: '' };

export function CustomersPage() {
  const settings = useSettings();
  const customers = useDb((s) => s.customers);
  const orders = useDb((s) => s.orders);
  const canManage = usePermission('customers.manage');

  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ customer?: Customer } | undefined>();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string>();

  const create = useAction(createCustomer, { success: 'Customer added' });
  const update = useAction((id: string, patch: Partial<Customer>) => updateCustomer(id, patch), { success: 'Customer updated' });

  const enriched = useMemo(() => customers.map((c) => ({ customer: c, stats: customerStats(c.id) })), [customers, orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched
      .filter(({ customer: c }) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email?.toLowerCase().includes(q))
      .sort((a, b) => b.stats.spend - a.stats.spend);
  }, [enriched, query]);

  const active = selected ? customers.find((c) => c.id === selected) : undefined;
  const activeStats = active ? customerStats(active.id) : undefined;
  const activeOrders = active ? orders.filter((o) => o.customerId === active.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)) : [];

  const openCreate = () => { setForm(EMPTY); setErrors({}); setEditing({}); };
  const openEdit = (c: Customer) => { setForm({ name: c.name, phone: c.phone, email: c.email ?? '', notes: c.notes ?? '' }); setErrors({}); setEditing({ customer: c }); };

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!/^\d{7,15}$/.test(form.phone.replace(/\s+/g, ''))) next.phone = 'Enter a valid phone number.';
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = 'Enter a valid email.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const payload = { name: form.name.trim(), phone: form.phone.replace(/\s+/g, ''), email: form.email.trim() || undefined, notes: form.notes.trim() || undefined };
    const res = editing?.customer
      ? await update.run(editing.customer.id, payload)
      : await create.run(payload);
    if (res.ok) setEditing(undefined);
  };

  const columns: Column<{ customer: Customer; stats: ReturnType<typeof customerStats> }>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortValue: ({ customer: c }) => c.name,
      render: ({ customer: c }) => (
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-roast text-sm font-bold text-white">{initials(c.name)}</span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-roast">{c.name}</p>
            <p className="flex items-center gap-1 truncate text-xs text-muted"><Phone size={11} />{c.phone}{c.email ? ` · ${c.email}` : ''}</p>
          </div>
        </div>
      ),
    },
    { key: 'loyalty', header: 'Loyalty', align: 'right', sortValue: ({ customer: c }) => c.loyaltyPoints, render: ({ customer: c }) => <Badge tone="caramel">{c.loyaltyPoints} pts</Badge> },
    { key: 'orders', header: 'Orders', align: 'right', sortValue: ({ stats }) => stats.orders, render: ({ stats }) => <span className="tabular-nums">{stats.orders}</span> },
    { key: 'spend', header: 'Spend', align: 'right', sortValue: ({ stats }) => stats.spend, render: ({ stats }) => <span className="font-semibold tabular-nums">{money(stats.spend)}</span> },
    { key: 'last', header: 'Last visit', render: ({ stats }) => <span className="text-xs text-muted">{stats.lastVisit ? relativeTime(stats.lastVisit) : 'Never'}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: ({ customer: c }) => canManage ? <Button size="sm" variant="ghost" icon={<Pencil size={14} />} onClick={(e) => { e.stopPropagation(); openEdit(c); }}>Edit</Button> : null,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Relationships"
        title="Customers"
        description="Your regulars, their loyalty points and every visit on record."
        actions={canManage && <Button icon={<UserPlus size={16} />} onClick={openCreate}>Add customer</Button>}
      />

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 p-4">
          <p className="text-sm text-muted"><strong className="text-roast">{customers.length}</strong> customers on file</p>
          <div className="w-full sm:w-72"><SearchInput value={query} onChange={setQuery} placeholder="Search name, phone or email…" /></div>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={({ customer }) => customer.id}
          onRowClick={({ customer }) => setSelected(customer.id)}
          empty={<EmptyState compact icon={<Users size={26} />} title="No customers found" description="Try a different search, or add a new customer." />}
        />
      </div>

      <Drawer
        open={!!active}
        onClose={() => setSelected(undefined)}
        eyebrow="Guest profile"
        title={active?.name ?? 'Customer'}
        footer={active && canManage && <Button variant="secondary" icon={<Pencil size={16} />} onClick={() => openEdit(active)}>Edit details</Button>}
      >
        {active && activeStats && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-roast text-xl font-bold text-white">{initials(active.name)}</span>
              <div>
                <p className="text-lg font-semibold text-roast">{active.name}</p>
                <p className="flex items-center gap-1 text-sm text-muted"><Phone size={12} />{active.phone}</p>
                {active.email && <p className="text-sm text-muted">{active.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <Metric label="Loyalty" value={`${active.loyaltyPoints}`} />
              <Metric label="Orders" value={`${activeStats.orders}`} />
              <Metric label="Spend" value={money(activeStats.spend)} />
            </div>

            <div className="rounded-xl border border-line bg-white p-3">
              <KeyValue label="Joined" value={formatDate(active.joinedAt)} />
              <KeyValue label="Last visit" value={activeStats.lastVisit ? relativeTime(activeStats.lastVisit) : 'Never'} />
              {active.notes && <KeyValue label="Notes" value={active.notes} />}
            </div>

            <div>
              <p className="label">Order history</p>
              {activeOrders.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line py-6 text-center text-sm text-faint">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line bg-white">
                  {activeOrders.slice(0, 10).map((o) => (
                    <li key={o.id} className="flex items-center gap-3 px-3 py-2.5">
                      <ProductImage src={o.lines[0]?.image} alt={o.lines[0]?.name ?? 'Order'} className="h-10 w-10 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-roast">{o.number}</p>
                        <p className="text-xs text-muted">{formatDate(o.createdAt)} · {o.lines.length} items</p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{money(o.totals.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-[11px] text-faint">Loyalty accrues at 1 point per {money(100)} spent. Figures are simulated demo data. Currency {settings.currency}.</p>
          </div>
        )}
      </Drawer>

      <Modal
        open={!!editing}
        onClose={() => setEditing(undefined)}
        eyebrow={editing?.customer ? 'Edit customer' : 'New customer'}
        title={editing?.customer ? editing.customer.name : 'Add a customer'}
        size="md"
        footer={<><Button variant="secondary" onClick={() => setEditing(undefined)}>Cancel</Button><Button loading={create.pending || update.pending} onClick={submit}>{editing?.customer ? 'Save changes' : 'Add customer'}</Button></>}
      >
        <div className="space-y-4">
          <FormField label="Full name" required error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ananya Rao" autoFocus /></FormField>
          <FormField label="Phone" required error={errors.phone} hint="7–15 digits, used for loyalty lookup."><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98450 12345" inputMode="tel" /></FormField>
          <FormField label="Email (optional)" error={errors.email}><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="guest@example.com" type="email" /></FormField>
          <FormField label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Preferences, allergies, occasions…" /></FormField>
        </div>
      </Modal>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-sand/70 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-1 font-display text-xl">{value}</p>
    </div>
  );
}
