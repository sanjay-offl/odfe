import { useMemo, useState } from 'react';
import { CalendarClock, CalendarPlus, Check, Plus, Users, X } from 'lucide-react';
import type { CafeTable, Reservation, ReservationStatus, TableStatus } from '../types';
import { useDb } from '../services/db';
import { useAction, useClock } from '../hooks/useAsync';
import { usePermission } from '../hooks/useSettings';
import {
  cancelReservation, createReservation, createTable, seatReservation, setTableStatus, updateReservation,
} from '../services/api';
import { elapsed, formatDateTime, initials } from '../lib/format';
import { PageHeader } from '../components/ui/display';
import { Badge, Button, FormField, Input, Select, Textarea, Tabs } from '../components/ui/primitives';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/feedback';

const STATUS_TONE: Record<TableStatus, 'green' | 'amber' | 'blue' | 'neutral'> = {
  AVAILABLE: 'green', OCCUPIED: 'amber', RESERVED: 'blue', CLEANING: 'neutral',
};
const STATUS_LABEL: Record<TableStatus, string> = {
  AVAILABLE: 'Available', OCCUPIED: 'Occupied', RESERVED: 'Reserved', CLEANING: 'Cleaning',
};
const RES_TONE: Record<ReservationStatus, 'green' | 'amber' | 'blue' | 'red'> = {
  UPCOMING: 'blue', SEATED: 'amber', COMPLETED: 'green', CANCELLED: 'red',
};

function localInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TablesPage() {
  const tables = useDb((s) => s.tables);
  const reservations = useDb((s) => s.reservations);
  const orders = useDb((s) => s.orders);
  const canManage = usePermission('tables.manage');
  const now = useClock(30000);

  const [tab, setTab] = useState<'floor' | 'reservations'>('floor');
  const [statusTarget, setStatusTarget] = useState<CafeTable>();
  const [showAddTable, setShowAddTable] = useState(false);
  const [tableForm, setTableForm] = useState({ number: '', capacity: '2', section: 'Main floor' });
  const [resForm, setResForm] = useState<{ reservation?: Reservation; customerName: string; phone: string; partySize: string; tableId: string; time: string; notes: string } | undefined>();

  const setStatus = useAction((id: string, s: TableStatus) => setTableStatus(id, s), { success: 'Table updated' });
  const addTable = useAction(createTable, { success: 'Table added' });
  const saveRes = useAction(async (payload: Omit<Reservation, 'id' | 'status'> & { id?: string }) => {
    if (payload.id) return updateReservation(payload.id, payload);
    return createReservation(payload);
  }, { success: 'Reservation saved' });
  const seat = useAction(seatReservation, { success: 'Guest seated' });
  const cancelRes = useAction(cancelReservation, { success: 'Reservation cancelled' });

  const ordered = useMemo(() => [...tables].sort((a, b) => a.number - b.number), [tables]);
  const sections = useMemo(() => [...new Set(ordered.map((t) => t.section))], [ordered]);
  const upcoming = reservations.filter((r) => r.status === 'UPCOMING' || r.status === 'SEATED').sort((a, b) => +new Date(a.time) - +new Date(b.time));
  const past = reservations.filter((r) => r.status === 'COMPLETED' || r.status === 'CANCELLED');

  const stats = {
    available: tables.filter((t) => t.status === 'AVAILABLE').length,
    occupied: tables.filter((t) => t.status === 'OCCUPIED').length,
    reserved: tables.filter((t) => t.status === 'RESERVED').length,
  };

  const openReservation = (reservation?: Reservation) => {
    const start = new Date(Date.now() + 2 * 3600e3);
    setResForm(reservation
      ? { reservation, customerName: reservation.customerName, phone: reservation.phone, partySize: String(reservation.partySize), tableId: reservation.tableId, time: localInput(new Date(reservation.time)), notes: reservation.notes ?? '' }
      : { customerName: '', phone: '', partySize: '2', tableId: ordered[0]?.id ?? '', time: localInput(start), notes: '' });
  };

  const submitReservation = async () => {
    if (!resForm) return;
    const res = await saveRes.run({
      id: resForm.reservation?.id,
      customerName: resForm.customerName,
      phone: resForm.phone,
      partySize: Number(resForm.partySize),
      tableId: resForm.tableId,
      time: new Date(resForm.time).toISOString(),
      notes: resForm.notes || undefined,
    });
    if (res.ok) setResForm(undefined);
  };

  const submitTable = async () => {
    const res = await addTable.run({ number: Number(tableForm.number), capacity: Number(tableForm.capacity), section: tableForm.section });
    if (res.ok) { setShowAddTable(false); setTableForm({ number: '', capacity: '2', section: 'Main floor' }); }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Front of house"
        title="Tables & reservations"
        description="Track every table and keep the booking book tidy."
        actions={
          canManage && (
            <>
              <Button variant="secondary" icon={<Plus size={16} />} onClick={() => setShowAddTable(true)}>Add table</Button>
              <Button icon={<CalendarPlus size={16} />} onClick={() => openReservation()}>New reservation</Button>
            </>
          )
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Available" value={stats.available} tone="green" />
        <Stat label="Occupied" value={stats.occupied} tone="amber" />
        <Stat label="Reserved" value={stats.reserved} tone="blue" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { value: 'floor', label: 'Floor plan' },
          { value: 'reservations', label: 'Reservations', count: upcoming.length },
        ]}
      />

      {tab === 'floor' ? (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section}>
              <p className="eyebrow mb-2">{section}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {ordered.filter((t) => t.section === section).map((t) => {
                  const order = t.orderId ? orders.find((o) => o.id === t.orderId) : undefined;
                  return (
                    <button
                      key={t.id}
                      disabled={!canManage}
                      onClick={() => canManage && setStatusTarget(t)}
                      className="card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-card"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-display text-2xl">{t.number}</span>
                        <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted"><Users size={12} />{t.capacity} seats</p>
                      {order ? (
                        <p className="mt-1 truncate text-xs text-caramel">{order.number} · {elapsed(order.createdAt, now)}</p>
                      ) : (
                        <p className="mt-1 text-xs text-faint">{t.status === 'RESERVED' ? 'Held for a booking' : 'No active order'}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="card">
            <div className="border-b border-line/70 px-4 py-3"><h3 className="font-semibold">Upcoming & seated</h3></div>
            {upcoming.length === 0 ? (
              <EmptyState compact icon={<CalendarClock size={26} />} title="No upcoming reservations" description="Bookings you add will show here." />
            ) : (
              <ul className="divide-y divide-line/60">
                {upcoming.map((r) => {
                  const table = tables.find((t) => t.id === r.tableId);
                  return (
                    <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-roast text-sm font-bold text-white">{initials(r.customerName)}</span>
                      <div className="min-w-[150px] flex-1">
                        <p className="font-semibold text-roast">{r.customerName}</p>
                        <p className="text-xs text-muted">{r.phone} · {(r.notes ? `${r.partySize} guests · ${r.notes}` : `${r.partySize} guests`)}</p>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-roast">Table {table?.number ?? '—'}</p>
                        <p className="text-xs text-muted">{formatDateTime(r.time)}</p>
                      </div>
                      <Badge tone={RES_TONE[r.status]}>{r.status}</Badge>
                      {canManage && (
                        <div className="flex gap-1.5">
                          {r.status === 'UPCOMING' && <Button size="sm" variant="secondary" icon={<Check size={14} />} loading={seat.pending} onClick={() => seat.run(r.id)}>Seat</Button>}
                          <Button size="sm" variant="ghost" onClick={() => openReservation(r)}>Edit</Button>
                          <Button size="sm" variant="ghost" icon={<X size={14} />} onClick={() => cancelRes.run(r.id)} aria-label="Cancel reservation" />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {past.length > 0 && (
            <div className="card">
              <div className="border-b border-line/70 px-4 py-3"><h3 className="font-semibold">History</h3></div>
              <ul className="divide-y divide-line/60">
                {past.slice(0, 8).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className="text-roast">{r.customerName} · {r.partySize} guests</span>
                    <span className="text-muted">{formatDateTime(r.time)}</span>
                    <Badge tone={RES_TONE[r.status]}>{r.status}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Change table status */}
      <Modal
        open={!!statusTarget}
        onClose={() => setStatusTarget(undefined)}
        eyebrow={statusTarget ? `${statusTarget.section} · ${statusTarget.capacity} seats` : ''}
        title={statusTarget ? `Table ${statusTarget.number}` : 'Table'}
        size="sm"
      >
        <div className="grid grid-cols-2 gap-2">
          {(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'] as TableStatus[]).map((s) => (
            <Button
              key={s}
              variant={statusTarget?.status === s ? 'primary' : 'secondary'}
              loading={setStatus.pending}
              onClick={async () => { if (statusTarget) { const res = await setStatus.run(statusTarget.id, s); if (res.ok) setStatusTarget(undefined); } }}
            >
              {STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
        {statusTarget?.orderId && <p className="mt-4 text-xs text-muted">This table has an active order. Completing or cancelling it will free the table automatically.</p>}
      </Modal>

      {/* Add table */}
      <Modal
        open={showAddTable}
        onClose={() => setShowAddTable(false)}
        eyebrow="Floor plan"
        title="Add a table"
        size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowAddTable(false)}>Cancel</Button><Button loading={addTable.pending} onClick={submitTable} disabled={!tableForm.number}>Add table</Button></>}
      >
        <div className="space-y-4">
          <FormField label="Table number" required><Input type="number" min={1} value={tableForm.number} onChange={(e) => setTableForm({ ...tableForm, number: e.target.value })} placeholder="13" autoFocus /></FormField>
          <FormField label="Seats"><Input type="number" min={1} value={tableForm.capacity} onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })} /></FormField>
          <FormField label="Section"><Input value={tableForm.section} onChange={(e) => setTableForm({ ...tableForm, section: e.target.value })} placeholder="Main floor" /></FormField>
        </div>
      </Modal>

      {/* Reservation form */}
      <Modal
        open={!!resForm}
        onClose={() => setResForm(undefined)}
        eyebrow="Bookings"
        title={resForm?.reservation ? 'Edit reservation' : 'New reservation'}
        size="md"
        footer={<><Button variant="secondary" onClick={() => setResForm(undefined)}>Cancel</Button><Button loading={saveRes.pending} onClick={submitReservation} disabled={!resForm?.customerName || !resForm?.tableId}>Save</Button></>}
      >
        {resForm && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Guest name" required><Input value={resForm.customerName} onChange={(e) => setResForm({ ...resForm, customerName: e.target.value })} placeholder="e.g. Priya Menon" autoFocus /></FormField>
              <FormField label="Phone"><Input value={resForm.phone} onChange={(e) => setResForm({ ...resForm, phone: e.target.value })} placeholder="98450 12345" inputMode="tel" /></FormField>
              <FormField label="Party size"><Input type="number" min={1} value={resForm.partySize} onChange={(e) => setResForm({ ...resForm, partySize: e.target.value })} /></FormField>
              <FormField label="Table" required>
                <Select value={resForm.tableId} onChange={(e) => setResForm({ ...resForm, tableId: e.target.value })}>
                  {ordered.map((t) => <option key={t.id} value={t.id}>Table {t.number} · {t.section} ({t.capacity})</option>)}
                </Select>
              </FormField>
              <FormField label="Date & time" className="sm:col-span-2"><Input type="datetime-local" value={resForm.time} onChange={(e) => setResForm({ ...resForm, time: e.target.value })} /></FormField>
              <FormField label="Notes" className="sm:col-span-2"><Textarea value={resForm.notes} onChange={(e) => setResForm({ ...resForm, notes: e.target.value })} placeholder="Birthday, window seat, allergies…" /></FormField>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'green' | 'amber' | 'blue' }) {
  return (
    <div className="card flex items-center justify-between p-4">
      <span className="text-sm text-muted">{label}</span>
      <Badge tone={tone}>{value}</Badge>
    </div>
  );
}
