import { useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Coffee, Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Addon, DietaryTag, Product, SizeOption } from '../types';
import { useDb } from '../services/db';
import { useAction } from '../hooks/useAsync';
import { usePermission } from '../hooks/useSettings';
import {
  archiveProduct, createProduct, duplicateProduct, setProductAvailability, updateProduct,
} from '../services/api';
import { money } from '../lib/format';
import { uid } from '../lib/id';
import { PageHeader, ProductImage, PopularStar, FilterBar } from '../components/ui/display';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Button, Chip, FormField, IconButton, Input, SearchInput, Select, Textarea, Toggle, Badge } from '../components/ui/primitives';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog, EmptyState } from '../components/ui/feedback';

type StatusFilter = 'all' | 'available' | 'unavailable' | 'archived';

interface FormState {
  name: string;
  description: string;
  categoryId: string;
  price: string;
  image: string;
  prepMinutes: string;
  dietary: '' | DietaryTag;
  sendToKitchen: boolean;
  popular: boolean;
  available: boolean;
  trackStock: boolean;
  stockQty: string;
  sizes: SizeOption[];
  addons: Addon[];
}

const EMPTY_FORM: FormState = {
  name: '', description: '', categoryId: '', price: '', image: '', prepMinutes: '5',
  dietary: '', sendToKitchen: true, popular: false, available: true, trackStock: false, stockQty: '', sizes: [], addons: [],
};

const DIETARY: { value: '' | DietaryTag; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'VEG', label: 'Vegetarian' },
  { value: 'NON_VEG', label: 'Non-veg' },
  { value: 'VEGAN', label: 'Vegan' },
  { value: 'EGG', label: 'Contains egg' },
];

export function MenuPage() {
  const products = useDb((s) => s.products);
  const categories = useDb((s) => s.categories);
  const canManage = usePermission('menu.manage');

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [editing, setEditing] = useState<{ product?: Product } | undefined>();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [archiveTarget, setArchiveTarget] = useState<Product>();

  const save = useAction((payload: Omit<Product, 'id'>) => createProduct(payload), { success: 'Menu item created' });
  const update = useAction((id: string, patch: Partial<Product>) => updateProduct(id, patch), { success: 'Menu item updated' });
  const duplicate = useAction(duplicateProduct, { success: 'Duplicated' });
  const toggleAvailable = useAction((id: string, available: boolean) => setProductAvailability(id, available), { success: 'Availability updated', silent: true });
  const archive = useAction(archiveProduct, { success: 'Menu item archived' });

  const ordered = useMemo(() => [...categories].sort((a, b) => a.sortOrder - b.sortOrder), [categories]);
  const catName = (id: string) => ordered.find((c) => c.id === id)?.name;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (status === 'archived' ? !p.archived : p.archived) return false;
      if (status === 'available' && !(p.available && !p.archived)) return false;
      if (status === 'unavailable' && (p.available || p.archived)) return false;
      if (categoryId !== 'all' && p.categoryId !== categoryId) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, categoryId, status]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, categoryId: ordered[0]?.id ?? '' });
    setErrors({});
    setEditing({});
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name, description: p.description, categoryId: p.categoryId, price: String(p.price), image: p.image,
      prepMinutes: String(p.prepMinutes), dietary: p.dietary ?? '', sendToKitchen: p.sendToKitchen, popular: !!p.popular,
      available: p.available, trackStock: !!p.trackStock, stockQty: p.stockQty !== undefined ? String(p.stockQty) : '',
      sizes: p.sizes.map((s) => ({ ...s })), addons: p.addons.map((a) => ({ ...a })),
    });
    setErrors({});
    setEditing({ product: p });
  };

  const buildPayload = (): Omit<Product, 'id'> => ({
    name: form.name.trim(),
    description: form.description.trim(),
    categoryId: form.categoryId,
    price: Number(form.price),
    image: form.image.trim(),
    available: form.available,
    sendToKitchen: form.sendToKitchen,
    prepMinutes: Number(form.prepMinutes) || 0,
    dietary: form.dietary || undefined,
    popular: form.popular,
    sizes: form.sizes,
    addons: form.addons,
    trackStock: form.trackStock || undefined,
    stockQty: form.trackStock ? Number(form.stockQty) || 0 : undefined,
    archived: false,
  });

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.categoryId) next.categoryId = 'Choose a category.';
    if (!(Number(form.price) > 0)) next.price = 'Price must be greater than zero.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const res = editing?.product
      ? await update.run(editing.product.id, buildPayload())
      : await save.run(buildPayload());
    if (res.ok) setEditing(undefined);
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    const res = await archive.run(archiveTarget.id, !archiveTarget.archived);
    if (res.ok) setArchiveTarget(undefined);
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Item',
      sortValue: (p) => p.name,
      render: (p) => (
        <div className="flex items-center gap-3">
          <ProductImage src={p.image} alt={p.name} category={catName(p.categoryId)} className="h-11 w-11 shrink-0" />
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate font-semibold text-roast">{p.name} {p.popular && <PopularStar />}</p>
            <p className="truncate text-xs text-muted">{p.description || 'No description'}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => <Badge tone="neutral">{catName(p.categoryId) ?? '—'}</Badge> },
    { key: 'price', header: 'Price', align: 'right', sortValue: (p) => p.price, render: (p) => <span className="font-semibold tabular-nums">{money(p.price)}</span> },
    {
      key: 'stock',
      header: 'Stock',
      render: (p) =>
        p.trackStock ? (
          <span className={`text-sm ${ (p.stockQty ?? 0) <= 0 ? 'text-brick' : 'text-muted'}`}>{p.stockQty ?? 0} left</span>
        ) : (
          <span className="text-xs text-faint">Not tracked</span>
        ),
    },
    {
      key: 'available',
      header: 'Available',
      render: (p) => (
        <Toggle checked={p.available && !p.archived} disabled={!canManage || p.archived} label={`Toggle ${p.name}`} onChange={(v) => toggleAvailable.run(p.id, v)} />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-0.5">
          <IconButton label="Edit" onClick={() => openEdit(p)}><Pencil size={15} /></IconButton>
          <IconButton label="Duplicate" onClick={() => duplicate.run(p.id)}><Copy size={15} /></IconButton>
          <IconButton label={p.archived ? 'Restore' : 'Archive'} onClick={() => p.archived ? archive.run(p.id, false) : setArchiveTarget(p)}>
            {p.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Menu management"
        description="Create, price and pause items. Changes are reflected on the POS instantly."
        actions={canManage && <Button icon={<Plus size={16} />} onClick={openCreate}>Add item</Button>}
      />

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-line/70 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'available', 'unavailable', 'archived'] as StatusFilter[]).map((s) => (
              <Chip key={s} active={status === s} onClick={() => setStatus(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</Chip>
            ))}
          </div>
          <FilterBar>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-44" aria-label="Filter by category">
              <option value="all">All categories</option>
              {ordered.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <div className="w-64"><SearchInput value={query} onChange={setQuery} placeholder="Search items…" /></div>
          </FilterBar>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(p) => p.id}
          empty={<EmptyState compact icon={<Coffee size={26} />} title="No items match" description="Try another filter, or add your first menu item." action={canManage && <Button icon={<Plus size={16} />} onClick={openCreate}>Add item</Button>} />}
        />
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(undefined)}
        eyebrow={editing?.product ? 'Edit item' : 'New item'}
        title={editing?.product ? editing.product.name : 'Add a menu item'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(undefined)}>Cancel</Button>
            <Button loading={save.pending || update.pending} onClick={submit}>{editing?.product ? 'Save changes' : 'Create item'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" required error={errors.name} className="sm:col-span-2">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cardamom Latte" autoFocus />
            </FormField>
            <FormField label="Description" className="sm:col-span-2">
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A short, appetising description" />
            </FormField>
            <FormField label="Category" required error={errors.categoryId}>
              <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Select a category</option>
                {ordered.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Price" required error={errors.price}>
              <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="180" />
            </FormField>
            <FormField label="Prep time (min)">
              <Input type="number" min={0} value={form.prepMinutes} onChange={(e) => setForm({ ...form, prepMinutes: e.target.value })} placeholder="5" />
            </FormField>
            <FormField label="Dietary">
              <Select value={form.dietary} onChange={(e) => setForm({ ...form, dietary: e.target.value as FormState['dietary'] })}>
                {DIETARY.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Image URL" className="sm:col-span-2" hint="Optional. Falls back to a branded placeholder.">
              <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" />
            </FormField>
          </div>

          <div className="grid gap-3 rounded-xl border border-line bg-white p-3 sm:grid-cols-2">
            <ToggleRow label="Send to kitchen" checked={form.sendToKitchen} onChange={(v) => setForm({ ...form, sendToKitchen: v })} />
            <ToggleRow label="Mark as popular" checked={form.popular} onChange={(v) => setForm({ ...form, popular: v })} />
            <ToggleRow label="Available for sale" checked={form.available} onChange={(v) => setForm({ ...form, available: v })} />
            <ToggleRow label="Track stock" checked={form.trackStock} onChange={(v) => setForm({ ...form, trackStock: v })} />
            {form.trackStock && (
              <FormField label="Stock on hand" className="sm:col-span-2">
                <Input type="number" min={0} value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} placeholder="0" />
              </FormField>
            )}
          </div>

          <OptionEditor
            title="Sizes"
            rows={form.sizes}
            onChange={(sizes) => setForm({ ...form, sizes })}
            makeRow={() => ({ id: uid('size'), name: '', priceDelta: 0 })}
          />
          <OptionEditor
            title="Add-ons"
            rows={form.addons}
            onChange={(addons) => setForm({ ...form, addons })}
            makeRow={() => ({ id: uid('addon'), name: '', price: 0 })}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(undefined)}
        title="Archive this item?"
        message={archiveTarget ? `${archiveTarget.name} will be hidden from the POS and menu listings. You can restore it later.` : ''}
        confirmLabel="Archive"
        loading={archive.pending}
        onConfirm={confirmArchive}
      />
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg px-1 py-1 text-sm text-roast">
      {label}
      <Toggle checked={checked} onChange={onChange} label={label} />
    </label>
  );
}

function OptionEditor<T extends { id: string; name: string }>({
  title, rows, onChange, makeRow,
}: {
  title: string;
  rows: T[];
  onChange: (rows: T[]) => void;
  makeRow: () => T;
}) {
  const update = (id: string, patch: Partial<T>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const isSize = (r: T): r is T & SizeOption => 'priceDelta' in r;
  const isAddon = (r: T): r is T & Addon => 'price' in r;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="label mb-0">{title}</p>
        <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => onChange([...rows, makeRow()])}>Add</Button>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line py-3 text-center text-xs text-faint">No {title.toLowerCase()} configured.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <Input value={row.name} onChange={(e) => update(row.id, { name: e.target.value } as Partial<T>)} placeholder="Name" />
              <Input
                type="number" step="0.01" className="w-32"
                value={String(isSize(row) ? row.priceDelta : isAddon(row) ? row.price : 0)}
                onChange={(e) => update(row.id, (isSize(row) ? { priceDelta: Number(e.target.value) } : { price: Number(e.target.value) }) as unknown as Partial<T>)}
                aria-label="Amount"
              />
              <IconButton label="Remove" onClick={() => onChange(rows.filter((r) => r.id !== row.id))}><Trash2 size={15} /></IconButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
