// Domain model for the ODFE Cafe POS.
// NOTE: This app currently runs in DEMO MODE. The service layer in ./services/api.ts
// implements these shapes against an in-browser store and can be swapped for real HTTP
// calls without changing the pages/components that consume it.

export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';

export type DietaryTag = 'VEG' | 'NON_VEG' | 'VEGAN' | 'EGG';

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'WALLET';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export type PrepStatus = 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
export type ReservationStatus = 'UPCOMING' | 'SEATED' | 'COMPLETED' | 'CANCELLED';
export type StockUnit = 'kg' | 'g' | 'L' | 'ml' | 'pcs' | 'pack';
export type StockMovementType = 'IN' | 'OUT' | 'WASTE' | 'ADJUST';

export interface Category {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  active: boolean;
}

export interface SizeOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  image: string;
  available: boolean;
  sendToKitchen: boolean;
  prepMinutes: number;
  dietary?: DietaryTag;
  popular?: boolean;
  sizes: SizeOption[];
  addons: Addon[];
  /** If true, product stock is tracked and decremented on completed orders. */
  trackStock?: boolean;
  stockQty?: number;
  archived?: boolean;
}

export interface CartLine {
  lineId: string;
  productId: string;
  name: string;
  image: string;
  basePrice: number;
  sizeId?: string;
  sizeName?: string;
  sizePrice?: number;
  addons: Addon[];
  notes?: string;
  quantity: number;
  /** base + size delta + addons, rounded. */
  unitPrice: number;
  sendToKitchen: boolean;
  dietary?: DietaryTag;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge: number;
  total: number;
}

export interface Order {
  id: string;
  number: string;
  type: OrderType;
  tableId?: string;
  tableLabel?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  lines: CartLine[];
  totals: OrderTotals;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  prepStatus: PrepStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  cashierId: string;
  cashierName: string;
  branchId: string;
  discountCode?: string;
  cancelReason?: string;
  refundReason?: string;
  /** Idempotency key guarding against duplicate submissions. */
  idempotencyKey?: string;
}

export interface CafeTable {
  id: string;
  number: number;
  capacity: number;
  section: string;
  status: TableStatus;
  orderId?: string;
  occupiedSince?: string;
}

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  tableId: string;
  time: string;
  status: ReservationStatus;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  joinedAt: string;
  notes?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  sku: string;
  unit: StockUnit;
  quantity: number;
  minThreshold: number;
  supplier: string;
  costPerUnit: number;
  expiry?: string;
  category: string;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  at: string;
  by: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  active: boolean;
  branchId: string;
  joinedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
}

export interface PaymentMethodConfig {
  id: PaymentMethod;
  label: string;
  enabled: boolean;
}

export interface Settings {
  cafeName: string;
  tagline: string;
  logo?: string;
  currency: string;
  locale: string;
  taxRate: number;
  taxInclusive: boolean;
  serviceChargeEnabled: boolean;
  serviceChargeRate: number;
  orderPrefix: string;
  nextOrderNumber: number;
  receiptFooter: string;
  receiptHeader: string;
  paymentMethods: PaymentMethodConfig[];
  lowStockAlerts: boolean;
  expiryAlerts: boolean;
  soundAlerts: boolean;
  autoPrintReceipt: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string;
}

/** A parked/paused cart that can be resumed later. */
export interface HeldOrder {
  id: string;
  label: string;
  lines: CartLine[];
  customer?: Customer;
  orderType: OrderType;
  tableId?: string;
  notes?: string;
  at: string;
}

export interface Coupon {
  code: string;
  label: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  minSubtotal: number;
  active: boolean;
}

export interface DashboardSummary {
  todaySales: number;
  todayOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  bestSeller?: { name: string; quantity: number };
  lowStockCount: number;
}

export interface SalesPoint {
  label: string;
  value: number;
}

export interface ReportBundle {
  rangeLabel: string;
  summary: DashboardSummary;
  salesOverTime: SalesPoint[];
  ordersByHour: SalesPoint[];
  bestSellers: { productId: string; name: string; quantity: number; revenue: number }[];
  salesByCategory: SalesPoint[];
  salesByPayment: SalesPoint[];
  orderStatus: SalesPoint[];
  discounts: number;
  refunds: number;
}
