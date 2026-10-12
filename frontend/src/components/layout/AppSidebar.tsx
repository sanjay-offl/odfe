import { NavLink } from 'react-router-dom';
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useAuth } from '../../store/auth';
import { useUi } from '../../store/ui';
import { roleHas } from '../../lib/permissions';
import type { Role } from '../../types';
import { NAV_ITEMS, EXTRA_LINKS, landingPathFor, type NavItem } from './nav';
import { roleLabel } from '../../lib/roles';
import { LOGO_SRC, LOGO_ALT } from '../../lib/brand';

function visible(item: NavItem, role: Role) {
  if (item.roles && !item.roles.includes(role)) return false;
  return roleHas(role, item.permission);
}

const GROUPS: NavItem['group'][] = ['Operations', 'Catalogue', 'Business'];

export function AppSidebar() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const { sidebarOpen, closeSidebar, sidebarCollapsed, toggleCollapsed } = useUi();
  const role = user?.role;

  const renderItem = (item: NavItem) => {
    if (!role || !visible(item, role)) return null;
    const Icon = item.icon;
    return (
      <NavLink key={item.to} to={item.to} onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} title={sidebarCollapsed ? item.label : undefined}>
        <Icon size={19} className="shrink-0" />
        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-espresso/40 md:hidden" onClick={closeSidebar} aria-hidden />}
      <aside
        className={`sidebar-gradient fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 text-white transition-[width,transform] duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'md:w-[84px]' : 'md:w-[248px]'} w-[248px]`}
        aria-label="Primary navigation"
      >
        <div className="flex items-center justify-between px-4 pt-5">
          <NavLink to={role ? landingPathFor(role) : '/login'} className="flex items-center gap-2.5" onClick={closeSidebar}>
            <img src={LOGO_SRC} alt={LOGO_ALT} className="h-9 w-9 rounded-lg object-contain" />
            {!sidebarCollapsed && (
              <span className="leading-tight">
                <span className="block text-lg font-bold tracking-[0.08em]">ODFE</span>
                <span className="block text-[9px] uppercase tracking-[0.08em] text-white/55">cafe operations</span>
              </span>
            )}
          </NavLink>
          <button className="icon-btn text-white/70 hover:bg-white/10 md:hidden" onClick={closeSidebar} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {GROUPS.map((group) => {
            const items = NAV_ITEMS.filter((i) => i.group === group);
            const rendered = items.map(renderItem).filter(Boolean);
            if (!rendered.length) return null;
            return (
              <div key={group} className="pb-1">
                {!sidebarCollapsed && <p className="px-2.5 pb-1 pt-3 text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">{group}</p>}
                <div className="space-y-1">{rendered}</div>
              </div>
            );
          })}
          <div className="pt-2">
            {!sidebarCollapsed && <p className="px-2.5 pb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">Display</p>}
            <div className="space-y-1">{EXTRA_LINKS.map(renderItem)}</div>
          </div>
        </nav>

        <div className="border-t border-white/10 p-3">
          {!sidebarCollapsed && role && (
            <p className="px-2.5 pb-2 text-[11px] text-white/45">Signed in as <span className="font-semibold text-white/70">{roleLabel(role)}</span></p>
          )}
          <button className="nav-link w-full" onClick={() => useUi.getState().toggleCollapsed()} title="Toggle sidebar width">
            {sidebarCollapsed ? <PanelLeftOpen size={19} /> : <><PanelLeftClose size={19} /><span>Collapse</span></>}
          </button>
          <button className="nav-link w-full" onClick={logout}>
            <LogOut size={19} />
            {!sidebarCollapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
