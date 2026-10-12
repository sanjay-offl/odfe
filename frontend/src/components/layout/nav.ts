import {
  BarChart3, ChefHat, Coffee, LayoutDashboard, LayoutGrid, MonitorSmartphone, Package,
  ReceiptText, Settings, ShoppingBag, Tags, UserCog, Users, type LucideIcon,
} from 'lucide-react';
import type { Role } from '../../types';
import type { Permission } from '../../lib/permissions';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  /** Optional explicit allow-list of roles. */
  roles?: Role[];
  group: 'Operations' | 'Catalogue' | 'Business';
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'orders.view', roles: ['ADMIN', 'MANAGER', 'CASHIER'], group: 'Operations' },
  { to: '/pos', label: 'POS / New Order', icon: ShoppingBag, permission: 'pos.use', group: 'Operations' },
  { to: '/orders', label: 'Orders', icon: ReceiptText, permission: 'orders.view', group: 'Operations' },
  { to: '/kitchen', label: 'Kitchen Display', icon: ChefHat, permission: 'kitchen.view', group: 'Operations' },
  { to: '/tables', label: 'Tables & Reservations', icon: LayoutGrid, permission: 'tables.view', group: 'Operations' },
  { to: '/menu', label: 'Menu Management', icon: Coffee, permission: 'menu.view', group: 'Catalogue' },
  { to: '/categories', label: 'Categories', icon: Tags, permission: 'menu.view', group: 'Catalogue' },
  { to: '/customers', label: 'Customers', icon: Users, permission: 'customers.view', group: 'Business' },
  { to: '/inventory', label: 'Inventory', icon: Package, permission: 'inventory.view', group: 'Business' },
  { to: '/employees', label: 'Employees & Roles', icon: UserCog, permission: 'employees.view', group: 'Business' },
  { to: '/reports', label: 'Reports & Analytics', icon: BarChart3, permission: 'reports.view', group: 'Business' },
  { to: '/settings', label: 'Settings', icon: Settings, permission: 'settings.manage', group: 'Business' },
];

export const EXTRA_LINKS: NavItem[] = [
  { to: '/customer-display', label: 'Customer Display', icon: MonitorSmartphone, permission: 'pos.use', group: 'Operations' },
];

export function landingPathFor(role: Role | undefined): string {
  if (role === 'KITCHEN') return '/kitchen';
  if (role === 'CASHIER') return '/pos';
  return '/dashboard';
}
