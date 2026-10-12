import type { Role } from '../types';

const LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  KITCHEN: 'Kitchen staff',
};

export function roleLabel(role: Role): string {
  return LABELS[role] ?? role;
}

export const ROLES: Role[] = ['ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN'];

export function roleTone(role: Role): 'caramel' | 'blue' | 'green' | 'amber' {
  return role === 'ADMIN' ? 'caramel' : role === 'MANAGER' ? 'blue' : role === 'CASHIER' ? 'green' : 'amber';
}
