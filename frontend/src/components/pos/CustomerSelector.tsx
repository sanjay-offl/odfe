import { useMemo, useState } from 'react';
import { Phone, Plus, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Customer } from '../../types';
import { Modal } from '../ui/Modal';
import { Button, FormField, Input, SearchInput } from '../ui/primitives';
import { EmptyState } from '../ui/feedback';
import { useDb } from '../../services/db';
import { useAction } from '../../hooks/useAsync';
import { createCustomer } from '../../services/api';
import { initials } from '../../lib/format';

export function CustomerSelector({
  open,
  onClose,
  onSelect,
  selected,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (customer?: Customer) => void;
  selected?: Customer;
}) {
  const customers = useDb((s) => s.customers);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  const create = useAction(createCustomer, {
    success: 'Customer added',
    onSuccess: (customer) => {
      onSelect(customer);
      onClose();
      setCreating(false);
      setForm({ name: '', phone: '', email: '' });
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email?.toLowerCase().includes(q)).slice(0, 12);
  }, [customers, query]);

  const submit = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!/^\d{7,15}$/.test(form.phone.replace(/\s+/g, ''))) next.phone = 'Enter a valid phone number.';
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = 'Enter a valid email.';
    setErrors(next);
    if (Object.keys(next).length) return;
    create.run({ name: form.name, phone: form.phone, email: form.email || undefined });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Guest"
      title={creating ? 'New customer' : 'Select customer'}
      subtitle={creating ? 'Add a new guest to the directory.' : 'Walk-in orders do not need a customer.'}
      size="md"
      footer={
        creating ? (
          <>
            <Button variant="secondary" onClick={() => setCreating(false)}>Back</Button>
            <Button onClick={submit} loading={create.pending} icon={<UserPlus size={16} />}>Save customer</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => { onSelect(undefined); onClose(); }}>Clear guest</Button>
            <Button variant="secondary" icon={<Plus size={16} />} onClick={() => setCreating(true)}>New customer</Button>
          </>
        )
      }
    >
      {creating ? (
        <div className="space-y-4">
          <FormField label="Full name" required error={errors.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ananya Rao" />
          </FormField>
          <FormField label="Phone" required error={errors.phone} hint="7–15 digits, used for loyalty lookup.">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98450 12345" inputMode="tel" />
          </FormField>
          <FormField label="Email (optional)" error={errors.email}>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="guest@example.com" type="email" />
          </FormField>
        </div>
      ) : (
        <>
          <SearchInput value={query} onChange={setQuery} placeholder="Search by name, phone or email…" autoFocus />
          <div className="mt-4 space-y-1.5">
            {filtered.map((c) => (
              <button
                key={c.id}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${selected?.id === c.id ? 'border-caramel bg-[#fbeee0]' : 'border-transparent hover:bg-sand'}`}
                onClick={() => { onSelect(c); onClose(); }}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-roast text-sm font-bold text-white">{initials(c.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-roast">{c.name}</span>
                  <span className="flex items-center gap-1 text-xs text-muted"><Phone size={11} />{c.phone}{c.email ? ` · ${c.email}` : ''}</span>
                </span>
                <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-semibold text-caramel-dark">{c.loyaltyPoints} pts</span>
              </button>
            ))}
            {!filtered.length && <EmptyState compact title="No matching customers" description="Try a different search, or create a new customer." />}
          </div>
        </>
      )}
    </Modal>
  );
}
