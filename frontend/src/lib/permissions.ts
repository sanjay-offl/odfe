import type { Role } from '../types';

export type Permission =
  | 'pos.use'
  | 'orders.view'
  | 'orders.create'
  | 'orders.updateStatus'
  | 'orders.cancel'
  | 'orders.refund'
  | 'kitchen.view'
  | 'kitchen.update'
  | 'menu.view'
  | 'menu.manage'
  | 'categories.manage'
  | 'tables.view'
  | 'tables.manage'
  | 'customers.view'
  | 'customers.manage'
  | 'inventory.view'
  | 'inventory.manage'
  | 'employees.view'
  | 'employees.manage'
  | 'reports.view'
  | 'settings.manage';

const ALL: Permission[] = [
  'pos.use', 'orders.view', 'orders.create', 'orders.updateStatus', 'orders.cancel', 'orders.refund',
  'kitchen.view', 'kitchen.update', 'menu.view', 'menu.manage', 'categories.manage',
  'tables.view', 'tables.manage', 'customers.view', 'customers.manage',
  'inventory.view', 'inventory.manage', 'employees.view', 'employees.manage',
  'reports.view', 'settings.manage',
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ALL,
  MANAGER: [
    'pos.use', 'orders.view', 'orders.create', 'orders.updateStatus', 'orders.cancel', 'orders.refund',
    'kitchen.view', 'kitchen.update', 'menu.view', 'menu.manage', 'categories.manage',
    'tables.view', 'tables.manage', 'customers.view', 'customers.manage',
    'inventory.view', 'inventory.manage', 'employees.view', 'reports.view',
  ],
  CASHIER: [
    'pos.use', 'orders.view', 'orders.create', 'orders.updateStatus',
    'menu.view', 'tables.view', 'tables.manage', 'customers.view', 'customers.manage',
  ],
  KITCHEN: ['orders.view', 'orders.updateStatus', 'kitchen.view', 'kitchen.update', 'menu.view'],
};

export function roleHas(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

export function hasAny(role: Role | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => roleHas(role, p));
}
