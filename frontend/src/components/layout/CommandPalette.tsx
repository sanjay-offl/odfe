import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { SearchInput } from '../ui/primitives';
import { useAuth } from '../../store/auth';
import { useDb } from '../../services/db';
import { roleHas } from '../../lib/permissions';
import { NAV_ITEMS, EXTRA_LINKS } from './nav';
import { money } from '../../lib/format';

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const role = useAuth((s) => s.user?.role);
  const products = useDb((s) => s.products);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const navMatches = [...NAV_ITEMS, ...EXTRA_LINKS]
      .filter((i) => role && (!i.roles || i.roles.includes(role)) && roleHas(role, i.permission))
      .filter((i) => !q || i.label.toLowerCase().includes(q))
      .map((i) => ({ kind: 'Navigate' as const, label: i.label, to: i.to }));
    const productMatches = q
      ? products
          .filter((p) => !p.archived && p.name.toLowerCase().includes(q))
          .slice(0, 5)
          .map((p) => ({ kind: 'Menu item' as const, label: p.name, to: '/menu', detail: money(p.price) }))
      : [];
    return [...navMatches, ...productMatches].slice(0, 9);
  }, [query, role, products]);

  return (
    <Modal open={open} onClose={onClose} title="Search & jump to" size="md">
      <SearchInput value={query} onChange={setQuery} placeholder="Search pages, menu items…" autoFocus />
      <ul className="mt-4 space-y-1">
        {results.map((r, i) => (
          <li key={`${r.to}-${i}`}>
            <button
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-sand"
              onClick={() => {
                navigate(r.to);
                onClose();
              }}
            >
              <span className="flex items-center gap-3">
                <Search size={15} className="text-faint" />
                <span className="font-medium text-roast">{r.label}</span>
                <span className="text-[10px] uppercase tracking-wide text-faint">{r.kind}</span>
              </span>
              <span className="flex items-center gap-2 text-xs text-muted">
                {'detail' in r && r.detail}
                <ArrowRight size={14} />
              </span>
            </button>
          </li>
        ))}
        {!results.length && <li className="px-3 py-6 text-center text-sm text-muted">No matches for “{query}”.</li>}
      </ul>
    </Modal>
  );
}
