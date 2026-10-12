import { useMemo, useState } from 'react';
import { ArrowDownUp, Boxes, Package, PackagePlus, PackageX, Pencil, Plus, TrendingDown } from 'lucide-react';
import type { Ingredient, StockMovementType, StockUnit } from '../types';
import { useDb } from '../services/db';
import { useAction } from '../hooks/useAsync';
import { usePermission, useSettings } from '../hooks/useSettings';
import { adjustStock, createIngredient, deleteIngredient, updateIngredient } from '../services/api';
import { formatDate, money, relativeTime } from '../lib/format';
import { PageHeader, StatCard, KeyValue } from '../components/ui/display';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Badge, Button, Chip, FormField, Input, SearchInput, Select, Tabs } from '../components/ui/primitives';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog, EmptyState } from '../components/ui/feedback';

const UNITS: StockUnit[] = ['kg', 'g', 'L', 'ml', 'pcs', 'pack'];
const MOVE_TYPES: { value: StockMovementType; label: string }[] = [
  { value: 'IN', label: 'Stock in' },
  { value: 'OUT', label: 'Stock out' },
  { value: 'WASTE', label: 'Waste' },
  { value: 'ADJUST', label: 'Set count' },
];

interface IngForm {
  name: string; sku: string; unit: StockUnit; quantity: string; minThreshold: string;
  supplier: string; costPerUnit: string; expiry: string; category: string;
}
const EMPTY_ING: IngForm = { name: '', sku: '', unit: 'kg', quantity: '0', minThreshold: '0', supplier: '', costPerUnit: '0', expiry: '', category: 'Pantry' };

function stockStatus(i: Ingredient): { tone: 'green' | 'amber' | 'red'; label: string } {
  if (i.quantity <= 0) return { tone: 'red', label: 'Out' };
  if (i.quantity <= i.minThreshold) return { tone: 'amber', label: 'Low' };
  return { tone: 'green', label: 'Healthy' };
}

function expiryState(expiry?: string): { tone: 'red' | 'amber' | 'neutral'; label: string } | undefined {
  if (!expiry) return undefined;
  const days = (new Date(expiry).getTime() - Date.now()) / 86400000;
  if (days < 0) return { tone: 'red', label: 'Expired' };
  if (days <= 7) return { tone: 'amber', label: `${Math.ceil(days)}d left` };
  return undefined;
}

export function InventoryPage() {
  const settings = useSettings();
  const ingredients = useDb((s) => s.ingredients);
  const movements = useDb((s) => s.movements);
  const canManage = usePermission('inventory.manage');

  const [tab, setTab] = useState<'stock' | 'movements'>('stock');
  const [query, setQuery] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [catFilter, setCatFilter] = useState('all');
  const [adjustTarget, setAdjustTarget] = useState<Ingredient>();
  const [adjustForm, setAdjustForm] = useState<{ type: StockMovementType; quantity: string; reason: string }>({ type: 'IN', quantity: '', reason: '' });
  const [editing, setEditing] = useState<{ ingredient?: Ingredient } | undefined>();
  const [form, setForm] = useState<IngForm>(EMPTY_ING);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Ingredient>();

  const adjust = useAction(adjustStock, { success: 'Stock updated' });
  const create = useAction(createIngredient, { success: 'Ingredient added' });
  const update = useAction((id: string, patch: Partial<Ingredient>) => updateIngredient(id, patch), { success: 'Ingredient updated' });
  const remove = useAction(deleteIngredient, { success: 'Ingredient removed' });

  const categories = useMemo(() => [...new Set(ingredients.map((i) => i.category))].sort(), [ingredients]);
  const stats = useMemo(() => ({
    items: ingredients.length,
    low: ingredients.filter((i) => i.quantity > 0 && i.quantity <= i.minThreshold).length,
    out: ingredients.filter((i) => i.quantity <= 0).length,
    value: ingredients.reduce((s, i) => s + i.quantity * i.costPerUnit, 0),
  }), [ingredients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ingredients
      .filter((i) => !lowOnly || i.quantity <= i.minThreshold)
      .filter((i) => catFilter === 'all' || i.category === catFilter)
      .filter((i) => !q || i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.supplier.toLowerCase().includes(q))
      .sort((a, b) => a.quantity / Math.max(a.minThreshold, 1) - b.quantity / Math.max(b.minThreshold, 1));
  }, [ingredients, query, lowOnly, catFilter]);

  const openAdjust = (i: Ingredient) => { setAdjustTarget(i); setAdjustForm({ type: 'IN', quantity: '', reason: '' }); };
  const openCreate = () => { setForm(EMPTY_ING); setErrors({}); setEditing({}); };
  const openEdit = (i: Ingredient) => {
    setForm({ name: i.name, sku: i.sku, unit: i.unit, quantity: String(i.quantity), minThreshold: String(i.minThreshold), supplier: i.supplier, costPerUnit: String(i.costPerUnit), expiry: i.expiry ?? '', category: i.category });
    setErrors({}); setEditing({ ingredient: i });
  };

  const submitAdjust = async () => {
    if (!adjustTarget) return;
    const res = await adjust.run({ ingredientId: adjustTarget.id, type: adjustForm.type, quantity: Number(adjustForm.quantity), reason: adjustForm.reason });
    if (res.ok) setAdjustTarget(undefined);
  };

  const submitIngredient = async () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.sku.trim()) next.sku = 'SKU is required.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const payload: Omit<Ingredient, 'id'> = {
      name: form.name.trim(), sku: form.sku.trim(), unit: form.unit, quantity: Number(form.quantity) || 0,
      minThreshold: Number(form.minThreshold) || 0, supplier: form.supplier.trim(), costPerUnit: Number(form.costPerUnit) || 0,
      expiry: form.expiry || undefined, category: form.category.trim() || 'Pantry',
    };
    const res = editing?.ingredient ? await update.run(editing.ingredient.id, payload) : await create.run(payload);
    if (res.ok) setEditing(undefined);
  };

  const stockColumns: Column<Ingredient>[] = [
    {
      key: 'name',
      header: 'Ingredient',
      sortValue: (i) => i.name,
      render: (i) => (
        <div>
          <p className="font-semibold text-roast">{i.name}</p>
          <p className="font-mono text-xs text-muted">{i.sku}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (i) => <Badge tone="neutral">{i.category}</Badge> },
    {
      key: 'qty',
      header: 'On hand',
      align: 'right',
      sortValue: (i) => i.quantity,
      render: (i) => <span className="font-semibold tabular-nums">{i.quantity} {i.unit}<span className="ml-1 text-xs font-normal text-faint">/ {i.minThreshold}</span></span>,
    },
    { key: 'value', header: 'Value', align: 'right', sortValue: (i) => i.quantity * i.costPerUnit, render: (i) => <span className="tabular-nums text-muted">{money(i.quantity * i.costPerUnit)}</span> },
    {
      key: 'expiry',
      header: 'Expiry',
      render: (i) => {
        const e = expiryState(i.expiry);
        if (!i.expiry) return <span className="text-xs text-faint">—</span>;
        return <div className="flex items-center gap-1.5"><span className="text-xs text-muted">{formatDate(i.expiry, { day: '2-digit', month: 'short' })}</span>{e && <Badge tone={e.tone === 'neutral' ? 'neutral' : e.tone}>{e.label}</Badge>}</div>;
      },
    },
    { key: 'status', header: 'Status', render: (i) => { const s = stockStatus(i); return <Badge tone={s.tone}>{s.label}</Badge>; } },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (i) => canManage ? (
        <div className="flex justify-end gap-0.5">
          <Button size="sm" variant="secondary" icon={<ArrowDownUp size={13} />} onClick={(e) => { e.stopPropagation(); openAdjust(i); }}>Adjust</Button>
          <Button size="sm" variant="ghost" icon={<Pencil size={13} />} onClick={() => openEdit(i)} aria-label="Edit" />
        </div>
      ) : null,
    },
  ];

  const moveColumns: Column<(typeof movements)[number]>[] = [
    { key: 'at', header: 'When', sortValue: (m) => m.at, render: (m) => <div><p className="text-sm text-roast">{formatDate(m.at)}</p><p className="text-xs text-muted">{relativeTime(m.at)}</p></div> },
    { key: 'ingredient', header: 'Item', render: (m) => <span className="font-medium text-roast">{m.ingredientName}</span> },
    { key: 'type', header: 'Type', render: (m) => <Badge tone={m.type === 'IN' ? 'green' : m.type === 'WASTE' ? 'red' : m.type === 'OUT' ? 'amber' : 'blue'}>{m.type}</Badge> },
    { key: 'quantity', header: 'Qty', align: 'right', sortValue: (m) => m.quantity, render: (m) => <span className="tabular-nums">{m.type === 'IN' ? '+' : '-'}{m.quantity}</span> },
    { key: 'reason', header: 'Reason', render: (m) => <span className="text-sm text-muted">{m.reason}</span> },
    { key: 'by', header: 'By', render: (m) => <span className="text-xs text-muted">{m.by}</span> },
  ];

  const sortedMovements = useMemo(() => [...movements].sort((a, b) => +new Date(b.at) - +new Date(a.at)), [movements]);

  return (
    <div>
      <PageHeader
        eyebrow="Back of house"
        title="Inventory"
        description="Stock on hand, thresholds and every movement in and out."
        actions={canManage && <Button icon={<PackagePlus size={16} />} onClick={openCreate}>Add ingredient</Button>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tracked items" value={String(stats.items)} icon={<Boxes size={18} />} tone="caramel" />
        <StatCard label="Low stock" value={String(stats.low)} icon={<TrendingDown size={18} />} tone={stats.low ? 'brick' : 'sage'} hint="At or below threshold" />
        <StatCard label="Out of stock" value={String(stats.out)} icon={<PackageX size={18} />} tone="brick" />
        <StatCard label="Stock value" value={money(stats.value)} icon={<Package size={18} />} tone="blue" hint="At cost price" />
      </div>

      <Tabs value={tab} onChange={setTab} className="mb-4" tabs={[{ value: 'stock', label: 'Stock levels' }, { value: 'movements', label: 'Movement log', count: movements.length }]} />

      {tab === 'stock' ? (
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Chip active={lowOnly} onClick={() => setLowOnly((v) => !v)}><TrendingDown size={12} /> Low stock only</Chip>
              <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="w-40" aria-label="Filter by category">
                <option value="all">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="w-full sm:w-64"><SearchInput value={query} onChange={setQuery} placeholder="Search item, SKU or supplier…" /></div>
          </div>
          <DataTable
            columns={stockColumns}
            rows={filtered}
            getRowId={(i) => i.id}
            onRowClick={canManage ? (i) => openAdjust(i) : undefined}
            empty={<EmptyState compact icon={<Boxes size={26} />} title="No ingredients match" description="Adjust your filters or add a new ingredient." />}
          />
        </div>
      ) : (
        <div className="card">
          <DataTable columns={moveColumns} rows={sortedMovements} getRowId={(m) => m.id} empty={<EmptyState compact icon={<ArrowDownUp size={26} />} title="No movements yet" description="Stock adjustments appear here." />} />
        </div>
      )}

      {/* Adjust stock */}
      <Modal
        open={!!adjustTarget}
        onClose={() => setAdjustTarget(undefined)}
        eyebrow="Stock movement"
        title={adjustTarget ? `${adjustTarget.name}` : 'Adjust stock'}
        subtitle={adjustTarget ? `Currently ${adjustTarget.quantity} ${adjustTarget.unit} on hand` : ''}
        size="sm"
        footer={<><Button variant="secondary" onClick={() => setAdjustTarget(undefined)}>Cancel</Button><Button loading={adjust.pending} onClick={submitAdjust} disabled={!adjustForm.quantity || !adjustForm.reason}>Record movement</Button></>}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {MOVE_TYPES.map((t) => <Chip key={t.value} active={adjustForm.type === t.value} onClick={() => setAdjustForm({ ...adjustForm, type: t.value })}>{t.label}</Chip>)}
          </div>
          <FormField label={adjustForm.type === 'ADJUST' ? 'New count' : 'Quantity'} required hint={adjustForm.type === 'ADJUST' ? 'The stock will be set to this value.' : adjustTarget ? `Measured in ${adjustTarget.unit}.` : ''}>
            <Input type="number" min={0} step="0.01" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} placeholder="0" autoFocus />
          </FormField>
          <FormField label="Reason" required>
            <Input value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} placeholder="e.g. Supplier delivery, spoilage" />
          </FormField>
        </div>
      </Modal>

      {/* Create / edit ingredient */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(undefined)}
        eyebrow={editing?.ingredient ? 'Edit ingredient' : 'New ingredient'}
        title={editing?.ingredient ? editing.ingredient.name : 'Add an ingredient'}
        size="lg"
        footer={
          <>
            {editing?.ingredient && canManage && <Button variant="danger" icon={<PackageX size={16} />} onClick={() => { setDeleteTarget(editing.ingredient); setEditing(undefined); }}>Delete</Button>}
            <Button variant="secondary" onClick={() => setEditing(undefined)}>Cancel</Button>
            <Button loading={create.pending || update.pending} onClick={submitIngredient}>{editing?.ingredient ? 'Save changes' : 'Add ingredient'}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" required error={errors.name} className="sm:col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Espresso Beans" autoFocus /></FormField>
          <FormField label="SKU" required error={errors.sku}><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="BEAN-002" /></FormField>
          <FormField label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Coffee" /></FormField>
          <FormField label="Unit"><Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as StockUnit })}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</Select></FormField>
          <FormField label="On hand"><Input type="number" step="0.01" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></FormField>
          <FormField label="Low-stock threshold"><Input type="number" step="0.01" min={0} value={form.minThreshold} onChange={(e) => setForm({ ...form, minThreshold: e.target.value })} /></FormField>
          <FormField label="Cost per unit"><Input type="number" step="0.01" min={0} value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} /></FormField>
          <FormField label="Supplier"><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Blue Tokai" /></FormField>
          <FormField label="Expiry"><Input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} /></FormField>
          <p className="text-[11px] text-faint sm:col-span-2">Prices shown in {settings.currency}. Figures are simulated demo data.</p>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        title="Delete this ingredient?"
        message={deleteTarget ? `${deleteTarget.name} and its stock record will be removed.` : ''}
        confirmLabel="Delete"
        loading={remove.pending}
        onConfirm={async () => { if (deleteTarget) { const res = await remove.run(deleteTarget.id); if (res.ok) setDeleteTarget(undefined); } }}
      >
        {deleteTarget && <KeyValue label="Current stock" value={`${deleteTarget.quantity} ${deleteTarget.unit}`} />}
      </ConfirmDialog>
    </div>
  );
}
