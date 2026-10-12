import { useEffect } from 'react';
import { useDb } from '../services/db';
import { useAuth } from '../store/auth';
import { configureMoney } from '../lib/format';
import { roleHas, type Permission } from '../lib/permissions';
import type { Settings } from '../types';

/** Reactive settings; also keeps the money formatter in sync with currency/locale. */
export function useSettings(): Settings {
  const settings = useDb((s) => s.settings);
  configureMoney(settings.currency, settings.locale);
  useEffect(() => {
    configureMoney(settings.currency, settings.locale);
    document.title = `${settings.cafeName} · Cafe POS`;
  }, [settings.currency, settings.locale, settings.cafeName]);
  return settings;
}

export function usePermission(permission: Permission): boolean {
  const role = useAuth((s) => s.user?.role);
  return roleHas(role, permission);
}

export function useRole() {
  return useAuth((s) => s.user?.role);
}
