import { useMemo, useState } from 'react';
import { Pencil, Plus, ShieldCheck, UserCog } from 'lucide-react';
import type { Employee, Role } from '../types';
import { ROLE_PERMISSIONS } from '../lib/permissions';
import { useDb } from '../services/db';
import { useAction } from '../hooks/useAsync';
import { usePermission } from '../hooks/useSettings';
import { createEmployee, updateEmployee } from '../services/api';
import { formatDate, initials } from '../lib/format';
import { roleLabel, ROLES, roleTone } from '../lib/roles';
import { PageHeader } from '../components/ui/display';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Badge, Button, Chip, FormField, Input, Select, Toggle } from '../components/ui/primitives';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/feedback';

interface FormState { name: string; email: string; phone: string; role: Role; branchId: string; active: boolean }

export function EmployeesPage() {
  const employees = useDb((s) => s.employees);
  const branches = useDb((s) => s.branches);
  const canManage = usePermission('employees.manage');

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [editing, setEditing] = useState<{ employee?: Employee } | undefined>();
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', role: 'CASHIER', branchId: branches[0]?.id ?? '', active: true });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = useAction(createEmployee, { success: 'Employee added' });
  const update = useAction((id: string, patch: Partial<Employee>) => updateEmployee(id, patch), { success: 'Employee updated' });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees
      .filter((e) => roleFilter === 'ALL' || e.role === roleFilter)
      .filter((e) => !q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q))
      .sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || a.name.localeCompare(b.name));
  }, [employees, query, roleFilter]);

  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? '—';

  const openCreate = () => { setForm({ name: '', email: '', phone: '', role: 'CASHIER', branchId: branches[0]?.id ?? '', active: true }); setErrors({}); setEditing({}); };
  const openEdit = (e: Employee) => { setForm({ name: e.name, email: e.email, phone: e.phone ?? '', role: e.role, branchId: e.branchId, active: e.active }); setErrors({}); setEditing({ employee: e }); };

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = 'Enter a valid email.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const payload = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined, role: form.role, branchId: form.branchId, active: form.active };
    const res = editing?.employee ? await update.run(editing.employee.id, payload) : await create.run(payload);
    if (res.ok) setEditing(undefined);
  };

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Team member',
      sortValue: (e) => e.name,
      render: (e) => (
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-roast text-sm font-bold text-white">{initials(e.name)}</span>
          <div>
            <p className="font-semibold text-roast">{e.name}</p>
            <p className="text-xs text-muted">{e.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', sortValue: (e) => e.role, render: (e) => <Badge tone={roleTone(e.role)}>{roleLabel(e.role)}</Badge> },
    { key: 'phone', header: 'Phone', render: (e) => <span className="text-sm text-muted">{e.phone ?? '—'}</span> },
    { key: 'branch', header: 'Branch', render: (e) => <span className="text-sm text-muted">{branchName(e.branchId)}</span> },
    { key: 'joined', header: 'Joined', render: (e) => <span className="text-xs text-muted">{formatDate(e.joinedAt)}</span> },
    { key: 'active', header: 'Active', render: (e) => <Toggle checked={e.active} disabled={!canManage} label={`Toggle ${e.name}`} onChange={(v) => update.run(e.id, { active: v })} /> },
    { key: 'actions', header: '', align: 'right', render: (e) => canManage ? <Button size="sm" variant="ghost" icon={<Pencil size={14} />} onClick={() => openEdit(e)}>Edit</Button> : null },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Access control"
        title="Employees & roles"
        description="Manage your team and what each role is allowed to do. Permissions are enforced in the service layer."
        actions={canManage && <Button icon={<Plus size={16} />} onClick={openCreate}>Add employee</Button>}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 p-4">
            <div className="flex flex-wrap gap-1.5">
              <Chip active={roleFilter === 'ALL'} onClick={() => setRoleFilter('ALL')}>All</Chip>
              {ROLES.map((r) => <Chip key={r} active={roleFilter === r} onClick={() => setRoleFilter(r)}>{roleLabel(r)}</Chip>)}
            </div>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search team…" className="sm:w-56" />
          </div>
          <DataTable
            columns={columns}
            rows={filtered}
            getRowId={(e) => e.id}
            empty={<EmptyState compact icon={<UserCog size={26} />} title="No team members" description="Add your first employee to get started." />}
          />
        </div>

        <aside className="card h-fit p-5">
          <p className="eyebrow mb-1">Reference</p>
          <h3 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={18} className="text-caramel" /> Role permissions</h3>
          <ul className="mt-4 space-y-3">
            {ROLES.map((r) => (
              <li key={r} className="rounded-xl border border-line bg-white p-3">
                <Badge tone={roleTone(r)}>{roleLabel(r)}</Badge>
                <p className="mt-2 text-xs text-muted">{ROLE_PERMISSIONS[r].length} permissions · {describeRole(r)}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-faint">Demo only: a production backend must re-check every permission server-side.</p>
        </aside>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(undefined)}
        eyebrow={editing?.employee ? 'Edit team member' : 'New team member'}
        title={editing?.employee ? editing.employee.name : 'Add an employee'}
        size="md"
        footer={<><Button variant="secondary" onClick={() => setEditing(undefined)}>Cancel</Button><Button loading={create.pending || update.pending} onClick={submit}>{editing?.employee ? 'Save changes' : 'Add employee'}</Button></>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full name" required error={errors.name} className="sm:col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jamie Lee" autoFocus /></FormField>
          <FormField label="Email" required error={errors.email}><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@odfe.cafe" /></FormField>
          <FormField label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98450 00000" inputMode="tel" /></FormField>
          <FormField label="Role" required>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
            </Select>
          </FormField>
          <FormField label="Branch">
            <Select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </FormField>
          <label className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-roast sm:col-span-2">
            Active account
            <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
          </label>
        </div>
      </Modal>
    </div>
  );
}

function describeRole(role: Role): string {
  switch (role) {
    case 'ADMIN': return 'full access including settings';
    case 'MANAGER': return 'operations, menu, inventory & reports';
    case 'CASHIER': return 'POS, tables & customers';
    case 'KITCHEN': return 'kitchen display only';
  }
}
