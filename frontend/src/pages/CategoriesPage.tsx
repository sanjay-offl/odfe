import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import type { Category } from '../types';
import { useDb } from '../services/db';
import { useAction } from '../hooks/useAsync';
import { usePermission } from '../hooks/useSettings';
import { createCategory, deleteCategory, reorderCategories, updateCategory } from '../services/api';
import { readableText } from '../lib/format';
import { PageHeader } from '../components/ui/display';
import { Button, Chip, FormField, IconButton, Input, Toggle } from '../components/ui/primitives';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog, EmptyState } from '../components/ui/feedback';

export function CategoriesPage() {
  const categories = useDb((s) => s.categories);
  const products = useDb((s) => s.products);
  const canManage = usePermission('categories.manage');

  const [editing, setEditing] = useState<{ category?: Category } | undefined>();
  const [form, setForm] = useState({ name: '', color: '#C47F3B', active: true });
  const [error, setError] = useState<string>();
  const [deleteTarget, setDeleteTarget] = useState<Category>();

  const create = useAction(createCategory, { success: 'Category created' });
  const update = useAction((id: string, patch: Partial<Category>) => updateCategory(id, patch), { success: 'Category updated' });
  const reorder = useAction(reorderCategories, { silent: true });
  const remove = useAction(deleteCategory, { success: 'Category removed' });

  const ordered = useMemo(() => [...categories].sort((a, b) => a.sortOrder - b.sortOrder), [categories]);
  const countFor = (id: string) => products.filter((p) => p.categoryId === id && !p.archived).length;

  const openCreate = () => { setForm({ name: '', color: '#C47F3B', active: true }); setError(undefined); setEditing({}); };
  const openEdit = (c: Category) => { setForm({ name: c.name, color: c.color, active: c.active }); setError(undefined); setEditing({ category: c }); };

  const submit = async () => {
    if (!form.name.trim()) return setError('Category name is required.');
    const res = editing?.category
      ? await update.run(editing.category.id, { name: form.name.trim(), color: form.color, active: form.active })
      : await create.run({ name: form.name.trim(), color: form.color, active: form.active });
    if (res.ok) setEditing(undefined);
  };

  const move = (category: Category, dir: -1 | 1) => {
    const idx = ordered.findIndex((c) => c.id === category.id);
    const target = idx + dir;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[idx], next[target]] = [next[target], next[idx]];
    reorder.run(next.map((c) => c.id));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await remove.run(deleteTarget.id);
    if (res.ok) setDeleteTarget(undefined);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Categories"
        description="Group the menu and give each section its own colour and ordering."
        actions={canManage && <Button icon={<Plus size={16} />} onClick={openCreate}>Add category</Button>}
      />

      {ordered.length === 0 ? (
        <div className="card"><EmptyState icon={<Tags size={26} />} title="No categories yet" description="Add your first category to start grouping the menu." /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ordered.map((c, i) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl text-lg font-bold" style={{ background: c.color, color: readableText(c.color) }}>
                    {c.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold text-roast">{c.name}</p>
                    <p className="text-xs text-muted">{countFor(c.id)} active items</p>
                  </div>
                </div>
                {!c.active && <Chip>Inactive</Chip>}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  <IconButton label="Move up" disabled={i === 0 || !canManage} onClick={() => move(c, -1)}><ArrowUp size={15} /></IconButton>
                  <IconButton label="Move down" disabled={i === ordered.length - 1 || !canManage} onClick={() => move(c, 1)}><ArrowDown size={15} /></IconButton>
                </div>
                {canManage && (
                  <div className="flex items-center gap-0.5">
                    <IconButton label="Edit" onClick={() => openEdit(c)}><Pencil size={15} /></IconButton>
                    <IconButton label="Delete" onClick={() => setDeleteTarget(c)}><Trash2 size={15} /></IconButton>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(undefined)}
        eyebrow={editing?.category ? 'Edit category' : 'New category'}
        title={editing?.category ? editing.category.name : 'Add a category'}
        size="sm"
        footer={<><Button variant="secondary" onClick={() => setEditing(undefined)}>Cancel</Button><Button loading={create.pending || update.pending} onClick={submit}>{editing?.category ? 'Save' : 'Create'}</Button></>}
      >
        <div className="space-y-4">
          <FormField label="Name" required error={error}>
            <Input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(undefined); }} placeholder="e.g. Smoothies" autoFocus />
          </FormField>
          <FormField label="Colour">
            <div className="flex items-center gap-3">
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-11 w-14 cursor-pointer rounded-xl border border-line bg-white p-1" aria-label="Category colour" />
              <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="font-mono" />
            </div>
          </FormField>
          <label className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-roast">
            Active on the POS
            <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        title="Delete this category?"
        message={deleteTarget ? `“${deleteTarget.name}” will be removed. Categories with menu items cannot be deleted.` : ''}
        confirmLabel="Delete"
        loading={remove.pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
