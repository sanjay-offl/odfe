import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Building2, ChevronDown, Menu, Search } from 'lucide-react';
import { useAuth } from '../../store/auth';
import { useUi } from '../../store/ui';
import { useDb } from '../../services/db';
import { useClock } from '../../hooks/useAsync';
import { formatDate, formatTime, relativeTime } from '../../lib/format';
import { roleLabel } from '../../lib/roles';
import { roleHas } from '../../lib/permissions';
import { initials } from '../../lib/format';
import { NAV_ITEMS } from './nav';
import { Badge } from '../ui/primitives';

function useBreadcrumb() {
  const { pathname } = useLocation();
  const item = NAV_ITEMS.find((i) => pathname.startsWith(i.to));
  return item?.label ?? 'Workspace';
}

export function AppHeader({ onOpenSearch }: { onOpenSearch: () => void }) {
  const user = useAuth((s) => s.user)!;
  const logout = useAuth((s) => s.logout);
  const setBranch = useAuth((s) => s.setBranch);
  const toggleSidebar = useUi((s) => s.toggleSidebar);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const now = useClock(1000);
  const [menu, setMenu] = useState<'none' | 'notifications' | 'profile' | 'branch'>('none');
  const branches = useDb((s) => s.branches);
  const ingredients = useDb((s) => s.ingredients);
  const orders = useDb((s) => s.orders);
  const settings = useDb((s) => s.settings);
  const crumb = useBreadcrumb();

  const notifications = useMemo(() => {
    const list: { id: string; title: string; detail: string; at?: string; tone: 'amber' | 'red' | 'blue' }[] = [];
    if (settings.lowStockAlerts && roleHas(user.role, 'inventory.view')) {
      ingredients
        .filter((i) => i.quantity <= i.minThreshold)
        .slice(0, 4)
        .forEach((i) => list.push({ id: `low-${i.id}`, title: `Low stock · ${i.name}`, detail: `${i.quantity} ${i.unit} left (min ${i.minThreshold})`, tone: 'amber' }));
    }
    orders
      .filter((o) => o.prepStatus === 'NEW')
      .slice(0, 3)
      .forEach((o) => list.push({ id: `new-${o.id}`, title: `New order ${o.number}`, detail: `${o.lines.length} items · ${o.tableLabel ?? o.type.replace('_', ' ').toLowerCase()}`, at: o.createdAt, tone: 'blue' }));
    return list;
  }, [ingredients, orders, settings.lowStockAlerts, user.role]);

  const currentBranch = branches.find((b) => b.id === user.branchId);

  const close = () => setMenu('none');

  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-cream/85 backdrop-blur">
      <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6">
        <button className="icon-btn md:hidden" onClick={toggleSidebar} aria-label="Toggle navigation">
          <Menu size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
            {pathname.startsWith('/pos') ? 'POS · New order' : crumb}
          </p>
          <h1 className="truncate text-lg font-semibold">
            {pathname.startsWith('/pos') ? 'Point of sale' : crumb}
          </h1>
        </div>

        <button className="hidden items-center gap-2 rounded-xl border border-line bg-white/70 px-3 py-2 text-sm text-muted transition-colors hover:bg-sand lg:flex" onClick={onOpenSearch}>
          <Search size={15} />
          <span>Search…</span>
          <kbd className="ml-4 rounded border border-line bg-sand px-1.5 py-0.5 text-[10px] font-semibold text-muted">⌘K</kbd>
        </button>

        <div className="hidden text-right text-xs leading-tight text-muted xl:block">
          <div className="font-semibold text-roast">{formatTime(new Date(now))}</div>
          <div>{formatDate(new Date(now), { weekday: 'short', day: '2-digit', month: 'short' })}</div>
        </div>

        {/* Branch selector */}
        <div className="relative hidden sm:block">
          <button className="flex items-center gap-2 rounded-xl border border-line bg-white/70 px-3 py-2 text-xs font-semibold text-roast hover:bg-sand" onClick={() => setMenu(menu === 'branch' ? 'none' : 'branch')} aria-haspopup="menu" aria-expanded={menu === 'branch'}>
            <Building2 size={15} className="text-caramel" />
            <span className="hidden max-w-[140px] truncate lg:block">{currentBranch?.name}</span>
            <ChevronDown size={14} />
          </button>
          {menu === 'branch' && (
            <>
              <div className="fixed inset-0 z-30" onClick={close} aria-hidden />
              <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-line bg-white p-1.5 shadow-pop">
                <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-faint">Branch</p>
                {branches.map((b) => (
                  <button key={b.id} className={`flex w-full flex-col rounded-lg px-2.5 py-2 text-left text-sm hover:bg-sand ${b.id === user.branchId ? 'bg-sand/70' : ''}`} onClick={() => { setBranch(b.id); close(); }}>
                    <span className="font-medium text-roast">{b.name}</span>
                    <span className="text-[11px] text-muted">{b.address}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button className="icon-btn relative" onClick={() => setMenu(menu === 'notifications' ? 'none' : 'notifications')} aria-label="Notifications" aria-haspopup="menu" aria-expanded={menu === 'notifications'}>
            <Bell size={19} />
            {notifications.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brick ring-2 ring-cream" />}
          </button>
          {menu === 'notifications' && (
            <>
              <div className="fixed inset-0 z-30" onClick={close} aria-hidden />
              <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-line bg-white shadow-pop">
                <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
                  <strong className="text-sm">Notifications</strong>
                  <Badge tone="neutral">{notifications.length}</Badge>
                </div>
                <div className="max-h-80 overflow-y-auto p-1.5">
                  {notifications.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted">You're all caught up.</p>}
                  {notifications.map((n) => (
                    <div key={n.id} className="flex gap-3 rounded-lg px-3 py-2.5 hover:bg-sand/60">
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.tone === 'amber' ? 'bg-honey' : n.tone === 'red' ? 'bg-brick' : 'bg-[#638BA8]'}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-roast">{n.title}</p>
                        <p className="truncate text-xs text-muted">{n.detail}{n.at ? ` · ${relativeTime(n.at, now)}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {roleHas(user.role, 'inventory.view') && (
                  <button className="w-full border-t border-line/70 py-2.5 text-xs font-semibold text-caramel hover:bg-sand" onClick={() => { navigate('/inventory'); close(); }}>
                    View inventory alerts
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-sand" onClick={() => setMenu(menu === 'profile' ? 'none' : 'profile')} aria-label="Account menu" aria-haspopup="menu" aria-expanded={menu === 'profile'}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-roast text-sm font-bold text-white">{initials(user.name)}</span>
            <ChevronDown size={14} className="hidden text-muted sm:block" />
          </button>
          {menu === 'profile' && (
            <>
              <div className="fixed inset-0 z-30" onClick={close} aria-hidden />
              <div className="absolute right-0 z-40 mt-2 w-60 rounded-xl border border-line bg-white p-1.5 shadow-pop">
                <div className="border-b border-line/70 px-3 py-2.5">
                  <p className="text-sm font-semibold text-roast">{user.name}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                  <Badge tone="caramel" className="mt-1.5">{roleLabel(user.role)}</Badge>
                </div>
                {roleHas(user.role, 'settings.manage') && (
                  <button className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-sand" onClick={() => { navigate('/settings'); close(); }}>Cafe settings</button>
                )}
                <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-brick hover:bg-brick-soft" onClick={logout}>Log out</button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
