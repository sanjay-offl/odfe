import { create } from 'zustand';
import type { Role, User } from '../types';
import { employees } from '../data/seed';

const SESSION_KEY = 'odfe-session';
const TOKEN_KEY = 'odfe-token';

function loadUser(): User | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export interface DemoAccount {
  email: string;
  password: string;
  user: User;
}

function toUser(role: Role): User {
  const emp = employees.find((e) => e.role === role)!;
  return { id: emp.id, name: emp.name, email: emp.email, role: emp.role, branchId: emp.branchId };
}

/** Demo credentials surfaced on the sign-in screen. Clearly labelled as demo. */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'admin@odfe.cafe', password: 'admin123', user: toUser('ADMIN') },
  { email: 'manager@odfe.cafe', password: 'manager123', user: toUser('MANAGER') },
  { email: 'cashier@odfe.cafe', password: 'cashier123', user: toUser('CASHIER') },
  { email: 'kitchen@odfe.cafe', password: 'kitchen123', user: toUser('KITCHEN') },
];

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  loginAs: (role: Role) => void;
  logout: () => void;
  setBranch: (branchId: string) => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: loadUser(),
  login: (email, password) => {
    const account = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!account) return { ok: false, error: 'No account found for that email. Try a demo account below.' };
    if (account.password !== password) return { ok: false, error: 'Incorrect password. Demo passwords are shown below.' };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(account.user));
    sessionStorage.setItem(TOKEN_KEY, `demo.${account.user.role.toLowerCase()}.token`);
    set({ user: account.user });
    return { ok: true };
  },
  loginAs: (role) => {
    const account = DEMO_ACCOUNTS.find((a) => a.user.role === role);
    if (!account) return;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(account.user));
    sessionStorage.setItem(TOKEN_KEY, `demo.${role.toLowerCase()}.token`);
    set({ user: account.user });
  },
  logout: () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    set({ user: null });
  },
  setBranch: (branchId) => {
    const user = get().user;
    if (!user) return;
    const next = { ...user, branchId };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    set({ user: next });
  },
}));

export function currentRole(): Role | undefined {
  return useAuth.getState().user?.role;
}

export function requireUser(): User {
  const user = useAuth.getState().user;
  if (!user) throw new Error('Not authenticated');
  return user;
}
