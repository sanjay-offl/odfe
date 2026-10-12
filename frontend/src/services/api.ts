// Async service layer.
//
// In DEMO MODE every function operates on the in-browser store in ./db.ts. The signatures
// and validation are intentionally backend-shaped (async, permission-checked, idempotent)
// so a real REST API can be dropped in later without changing pages/components.
//
// SECURITY NOTE: This demo has no server, so permission checks here model — but do not
// replace — real server-side authorisation. A production backend MUST re-check every rule.
import type {
  CafeTable, CartLine, Category, Coupon, Customer, Employee, Ingredient, Order, OrderType,
  PaymentMethod, PrepStatus, Product, ReportBundle, Reservation, SalesPoint, Settings,
  StockMovement, StockMovementType, User,
} from '../types';
import { computeTotals, discountAmountFor, roundMoney, type Discount } from '../lib/pricing';
import { roleHas, type Permission } from '../lib/permissions';
import { uid } from '../lib/id';
import { ForbiddenError, NotFoundError, PaymentError, ValidationError } from './errors';
import { dbSnapshot, useDb, type DbData } from './db';
import { requireUser } from '../store/auth';

const LATENCY = 220;

function delay(ms = LATENCY) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function read<T>(fn: () => T, ms = 60): Promise<T> {
  await delay(ms);
  return fn();
}

async function write<T>(fn: () => T, ms = LATENCY): Promise<T> {
  await delay(ms);
  return fn();
}

function assert(permission: Permission): User {
  const user = requireUser();
  if (!roleHas(user.role, permission)) {
    throw new ForbiddenError();
  }
  return user;
}

function findOrThrow<T extends { id: string }>(items: T[], id: string, label: string): T {
  const found = items.find((i) => i.id === id);
  if (!found) throw new NotFoundError(`${label} not found.`);
  return found;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const getSettings = () => read(() => dbSnapshot().settings);

export const updateSettings = (patch: Partial<Settings>) =>
  write(() => {
    assert('settings.manage');
    useDb.getState().mutate((s) => ({ settings: { ...s.settings, ...patch } }));
    return dbSnapshot().settings;
  });

export const resetDemoData = () =>
  write(() => {
    assert('settings.manage');
    useDb.getState().reset();
    return true;
  }, 400);

// ---------------------------------------------------------------------------
// Catalogue: categories + products
// ---------------------------------------------------------------------------

export const getCategories = () => read(() => dbSnapshot().categories);

export const createCategory = (input: { name: string; color: string; active?: boolean }) =>
  write(() => {
    assert('categories.manage');
    const name = input.name.trim();
    if (!name) throw new ValidationError('Category name is required.');
    if (dbSnapshot().categories.some((c) => c.name.toLowerCase() === name.toLowerCase()))
      throw new ValidationError('A category with that name already exists.');
    const category: Category = { id: uid('cat'), name, color: input.color || '#C47F3B', sortOrder: dbSnapshot().categories.length + 1, active: input.active ?? true };
    useDb.getState().mutate((s) => ({ categories: [...s.categories, category] }));
    return category;
  });

export const updateCategory = (id: string, patch: Partial<Category>) =>
  write(() => {
    assert('categories.manage');
    const categories = dbSnapshot().categories;
    findOrThrow(categories, id, 'Category');
    useDb.getState().mutate((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    return dbSnapshot().categories.find((c) => c.id === id)!;
  });

export const reorderCategories = (orderedIds: string[]) =>
  write(() => {
    assert('categories.manage');
    useDb.getState().mutate((s) => ({
      categories: s.categories.map((c) => ({ ...c, sortOrder: Math.max(1, orderedIds.indexOf(c.id) + 1) })),
    }));
    return dbSnapshot().categories.sort((a, b) => a.sortOrder - b.sortOrder);
  });

export const deleteCategory = (id: string) =>
  write(() => {
    assert('categories.manage');
    const inUse = dbSnapshot().products.some((p) => p.categoryId === id && !p.archived);
    if (inUse) throw new ValidationError('Move or archive products in this category first.');
    useDb.getState().mutate((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
    return true;
  });

export const getProducts = () => read(() => dbSnapshot().products);

export const createProduct = (input: Omit<Product, 'id'>) =>
  write(() => {
    assert('menu.manage');
    const name = input.name.trim();
    if (!name) throw new ValidationError('Product name is required.');
    if (input.price <= 0) throw new ValidationError('Price must be greater than zero.');
    if (!input.categoryId) throw new ValidationError('Please choose a category.');
    const product: Product = { ...input, name, id: uid('p') };
    useDb.getState().mutate((s) => ({ products: [product, ...s.products] }));
    return product;
  });

export const updateProduct = (id: string, patch: Partial<Product>) =>
  write(() => {
    assert('menu.manage');
    findOrThrow(dbSnapshot().products, id, 'Product');
    if (patch.price !== undefined && patch.price <= 0) throw new ValidationError('Price must be greater than zero.');
    useDb.getState().mutate((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    return dbSnapshot().products.find((p) => p.id === id)!;
  });

export const duplicateProduct = (id: string) =>
  write(() => {
    assert('menu.manage');
    const product = findOrThrow(dbSnapshot().products, id, 'Product');
    const copy: Product = { ...structuredClone(product), id: uid('p'), name: `${product.name} (copy)` };
    useDb.getState().mutate((s) => ({ products: [copy, ...s.products] }));
    return copy;
  });

export const setProductAvailability = (id: string, available: boolean) =>
  write(() => {
    assert('menu.manage');
    findOrThrow(dbSnapshot().products, id, 'Product');
    useDb.getState().mutate((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, available } : p)) }));
    return true;
  });

export const archiveProduct = (id: string, archived = true) =>
  write(() => {
    assert('menu.manage');
    findOrThrow(dbSnapshot().products, id, 'Product');
    useDb.getState().mutate((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, archived } : p)) }));
    return true;
  });

export const bulkSetAvailability = (ids: string[], available: boolean) =>
  write(() => {
    assert('menu.manage');
    useDb.getState().mutate((s) => ({ products: s.products.map((p) => (ids.includes(p.id) ? { ...p, available } : p)) }));
    return true;
  });

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const getOrders = () => read(() => dbSnapshot().orders);

export const getOrder = (id: string) => read(() => dbSnapshot().orders.find((o) => o.id === id));

export interface CheckoutPayload {
  type: OrderType;
  tableId?: string;
  customer?: Customer | null;
  lines: CartLine[];
  discount?: Discount;
  notes?: string;
  idempotencyKey: string;
}

/** Creates an UNPAID order. Totals are recomputed server-side from settings. */
export const checkout = (payload: CheckoutPayload) =>
  write(() => {
    const user = assert('orders.create');
    const db = dbSnapshot();

    if (!payload.lines.length) throw new ValidationError('Your cart is empty.');
    if (payload.type === 'DINE_IN' && !payload.tableId) throw new ValidationError('Please choose a table for dine-in orders.');

    // Duplicate-submission guard.
    if (payload.idempotencyKey) {
      const existing = db.orders.find((o) => o.idempotencyKey === payload.idempotencyKey);
      if (existing) return existing;
    }

    if (payload.type === 'DINE_IN' && payload.tableId) {
      const table = db.tables.find((t) => t.id === payload.tableId);
      if (table && table.status === 'OCCUPIED' && table.orderId) {
        const active = db.orders.find((o) => o.id === table.orderId);
        if (active && !['COMPLETED', 'CANCELLED'].includes(active.prepStatus)) {
          throw new ValidationError(`Table ${table.number} already has an active order.`);
        }
      }
    }

    const totals = computeTotals({
      lines: payload.lines,
      discount: payload.discount,
      taxRate: db.settings.taxRate,
      serviceChargeEnabled: db.settings.serviceChargeEnabled,
      serviceChargeRate: db.settings.serviceChargeRate,
    });

    const number = `${db.settings.orderPrefix}${db.settings.nextOrderNumber}`;
    const now = new Date().toISOString();
    const table = payload.tableId ? db.tables.find((t) => t.id === payload.tableId) : undefined;
    const order: Order = {
      id: uid('o'),
      number,
      type: payload.type,
      tableId: payload.type === 'DINE_IN' ? payload.tableId : undefined,
      tableLabel: table ? `Table ${table.number}` : undefined,
      customerId: payload.customer?.id,
      customerName: payload.customer?.name,
      customerPhone: payload.customer?.phone,
      lines: payload.lines,
      totals,
      paymentStatus: 'UNPAID',
      prepStatus: 'NEW',
      createdAt: now,
      updatedAt: now,
      notes: payload.notes?.trim() || undefined,
      cashierId: user.id,
      cashierName: user.name,
      branchId: user.branchId,
      discountCode: payload.discount?.code,
      idempotencyKey: payload.idempotencyKey,
    };

    useDb.getState().mutate((s) => ({
      orders: [order, ...s.orders],
      settings: { ...s.settings, nextOrderNumber: s.settings.nextOrderNumber + 1 },
      tables:
        order.type === 'DINE_IN' && order.tableId
          ? s.tables.map((t) => (t.id === order.tableId ? { ...t, status: 'OCCUPIED', orderId: order.id, occupiedSince: now } : t))
          : s.tables,
      // Loyalty: award 1 point per ₹100 spent (after payment we add; here we track on creation for simplicity).
    }));

    return order;
  }, 450);

export interface PaymentPayload {
  orderId: string;
  method: PaymentMethod;
  tendered?: number;
  /** DEMO ONLY: forces a declined payment so failure/retry states can be demonstrated. */
  simulateFailure?: boolean;
}

/**
 * Processes payment. Only sets PAID when the (simulated) authorization succeeds.
 * A failed payment leaves the order UNPAID.
 */
export const processPayment = (payload: PaymentPayload) =>
  write(() => {
    assert('orders.create');
    const order = findOrThrow(dbSnapshot().orders, payload.orderId, 'Order');
    if (order.paymentStatus === 'PAID') throw new ValidationError('This order has already been paid.');
    if (order.paymentStatus === 'REFUNDED') throw new ValidationError('This order was refunded.');
    if (order.prepStatus === 'CANCELLED') throw new ValidationError('This order was cancelled.');

    if (payload.method === 'CASH') {
      const tendered = payload.tendered ?? order.totals.total;
      if (tendered < order.totals.total) {
        throw new PaymentError(`Cash tendered (${tendered.toFixed(2)}) is less than the amount due.`);
      }
    }

    // Simulated authorization. Never marks paid unless it succeeds.
    if (payload.simulateFailure) {
      throw new PaymentError('Payment declined by the provider (demo). The order remains unpaid — please retry.');
    }

    const now = new Date().toISOString();
    useDb.getState().mutate((s) => ({
      orders: s.orders.map((o) => (o.id === order.id ? { ...o, paymentStatus: 'PAID', paymentMethod: payload.method, updatedAt: now } : o)),
      customers:
        order.customerId != null
          ? s.customers.map((c) => (c.id === order.customerId ? { ...c, loyaltyPoints: c.loyaltyPoints + Math.floor(order.totals.total / 100) } : c))
          : s.customers,
    }));

    const change = payload.method === 'CASH' ? roundMoney((payload.tendered ?? order.totals.total) - order.totals.total) : 0;
    return { order: dbSnapshot().orders.find((o) => o.id === order.id)!, change };
  }, 500);

const PREP_TRANSITIONS: Record<PrepStatus, PrepStatus[]> = {
  NEW: ['PREPARING', 'READY', 'COMPLETED', 'CANCELLED'],
  PREPARING: ['READY', 'COMPLETED', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionPrep(from: PrepStatus, to: PrepStatus): boolean {
  return PREP_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Advances kitchen preparation status and applies inventory rules on completion. */
export const updatePrepStatus = (orderId: string, status: PrepStatus) =>
  write(() => {
    const user = requireUser();
    if (!roleHas(user.role, 'kitchen.update') && !roleHas(user.role, 'orders.updateStatus')) throw new ForbiddenError();
    const order = findOrThrow(dbSnapshot().orders, orderId, 'Order');
    if (!canTransitionPrep(order.prepStatus, status)) {
      throw new ValidationError(`Cannot move an order from ${order.prepStatus} to ${status}.`);
    }
    const now = new Date().toISOString();

    useDb.getState().mutate((s) => {
      // Inventory: deduct tracked product stock when an order is completed.
      let products = s.products;
      const movements: StockMovement[] = [];
      if (status === 'COMPLETED') {
        products = s.products.map((p) => {
          const qty = order.lines.filter((l) => l.productId === p.id).reduce((n, l) => n + l.quantity, 0);
          if (p.trackStock && qty > 0 && p.stockQty !== undefined) {
            return { ...p, stockQty: Math.max(0, p.stockQty - qty) };
          }
          return p;
        });
      }

      // Free the table when the order leaves active service.
      let tables = s.tables;
      if (order.tableId && (status === 'COMPLETED' || status === 'CANCELLED')) {
        tables = s.tables.map((t) =>
          t.id === order.tableId
            ? { ...t, status: status === 'COMPLETED' ? 'CLEANING' : 'AVAILABLE', orderId: undefined, occupiedSince: undefined }
            : t,
        );
      }

      return {
        products,
        tables,
        movements: movements.length ? [...movements, ...s.movements] : s.movements,
        orders: s.orders.map((o) => (o.id === order.id ? { ...o, prepStatus: status, updatedAt: now } : o)),
      };
    });

    return dbSnapshot().orders.find((o) => o.id === order.id)!;
  }, 260);

export const cancelOrder = (orderId: string, reason: string) =>
  write(() => {
    assert('orders.cancel');
    const order = findOrThrow(dbSnapshot().orders, orderId, 'Order');
    if (order.prepStatus === 'COMPLETED') throw new ValidationError('Completed orders cannot be cancelled — issue a refund instead.');
    if (order.prepStatus === 'CANCELLED') throw new ValidationError('This order is already cancelled.');
    if (!reason.trim()) throw new ValidationError('A cancellation reason is required.');
    const now = new Date().toISOString();
    useDb.getState().mutate((s) => ({
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, prepStatus: 'CANCELLED', cancelReason: reason.trim(), updatedAt: now } : o)),
      tables: s.tables.map((t) => (t.orderId === orderId ? { ...t, status: 'AVAILABLE', orderId: undefined, occupiedSince: undefined } : t)),
    }));
    return dbSnapshot().orders.find((o) => o.id === orderId)!;
  });

export const refundOrder = (orderId: string, reason: string) =>
  write(() => {
    assert('orders.refund');
    const order = findOrThrow(dbSnapshot().orders, orderId, 'Order');
    if (order.paymentStatus !== 'PAID') throw new ValidationError('Only paid orders can be refunded.');
    if (!reason.trim()) throw new ValidationError('A refund reason is required.');
    const now = new Date().toISOString();
    useDb.getState().mutate((s) => {
      // Restore tracked stock if the order had been completed.
      const products =
        order.prepStatus === 'COMPLETED'
          ? s.products.map((p) => {
              const qty = order.lines.filter((l) => l.productId === p.id).reduce((n, l) => n + l.quantity, 0);
              return p.trackStock && qty > 0 && p.stockQty !== undefined ? { ...p, stockQty: p.stockQty + qty } : p;
            })
          : s.products;
      return {
        products,
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, paymentStatus: 'REFUNDED', refundReason: reason.trim(), updatedAt: now } : o)),
      };
    });
    return dbSnapshot().orders.find((o) => o.id === orderId)!;
  });

// ---------------------------------------------------------------------------
// Tables + reservations
// ---------------------------------------------------------------------------

export const getTables = () => read(() => dbSnapshot().tables);
export const getReservations = () => read(() => dbSnapshot().reservations);

export const setTableStatus = (tableId: string, status: CafeTable['status']) =>
  write(() => {
    assert('tables.manage');
    findOrThrow(dbSnapshot().tables, tableId, 'Table');
    useDb.getState().mutate((s) => ({
      tables: s.tables.map((t) => (t.id === tableId ? { ...t, status, ...(status === 'AVAILABLE' || status === 'CLEANING' ? { orderId: undefined, occupiedSince: undefined } : {}) } : t)),
    }));
    return dbSnapshot().tables.find((t) => t.id === tableId)!;
  });

export const createTable = (input: { number: number; capacity: number; section: string }) =>
  write(() => {
    assert('tables.manage');
    if (!input.number || input.number < 1) throw new ValidationError('Table number must be a positive number.');
    if (dbSnapshot().tables.some((t) => t.number === input.number)) throw new ValidationError(`Table ${input.number} already exists.`);
    const table: CafeTable = { id: uid('t'), number: input.number, capacity: input.capacity || 2, section: input.section || 'Main floor', status: 'AVAILABLE' };
    useDb.getState().mutate((s) => ({ tables: [...s.tables, table] }));
    return table;
  });

export const transferOrder = (orderId: string, toTableId: string) =>
  write(() => {
    assert('tables.manage');
    const order = findOrThrow(dbSnapshot().orders, orderId, 'Order');
    if (order.type !== 'DINE_IN') throw new ValidationError('Only dine-in orders can be transferred.');
    const target = findOrThrow(dbSnapshot().tables, toTableId, 'Table');
    if (target.status === 'OCCUPIED' && target.orderId !== orderId) throw new ValidationError(`Table ${target.number} is occupied.`);
    useDb.getState().mutate((s) => ({
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, tableId: toTableId, tableLabel: `Table ${target.number}` } : o)),
      tables: s.tables.map((t) => {
        if (t.id === order.tableId) return { ...t, status: 'CLEANING', orderId: undefined, occupiedSince: undefined };
        if (t.id === toTableId) return { ...t, status: 'OCCUPIED', orderId, occupiedSince: order.createdAt };
        return t;
      }),
    }));
    return dbSnapshot().orders.find((o) => o.id === orderId)!;
  });

export const createReservation = (input: Omit<Reservation, 'id' | 'status'> & { status?: Reservation['status'] }) =>
  write(() => {
    assert('tables.manage');
    if (!input.customerName.trim()) throw new ValidationError('Customer name is required.');
    if (!input.tableId) throw new ValidationError('Please select a table.');
    if (!input.partySize || input.partySize < 1) throw new ValidationError('Party size must be at least 1.');
    const conflict = dbSnapshot().reservations.find((r) => r.tableId === input.tableId && r.status === 'UPCOMING' && Math.abs(new Date(r.time).getTime() - new Date(input.time).getTime()) < 90 * 60 * 1000);
    if (conflict) throw new ValidationError(`This table already has a reservation near that time (${conflict.customerName}). Adjust the time or choose another table.`);
    const reservation: Reservation = { ...input, id: uid('r'), status: input.status ?? 'UPCOMING' };
    useDb.getState().mutate((s) => ({
      reservations: [reservation, ...s.reservations],
      tables: s.tables.map((t) => (t.id === reservation.tableId && t.status === 'AVAILABLE' ? { ...t, status: 'RESERVED' } : t)),
    }));
    return reservation;
  });

export const updateReservation = (id: string, patch: Partial<Reservation>) =>
  write(() => {
    assert('tables.manage');
    findOrThrow(dbSnapshot().reservations, id, 'Reservation');
    useDb.getState().mutate((s) => ({ reservations: s.reservations.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
    return dbSnapshot().reservations.find((r) => r.id === id)!;
  });

export const cancelReservation = (id: string) =>
  write(() => {
    assert('tables.manage');
    const res = findOrThrow(dbSnapshot().reservations, id, 'Reservation');
    useDb.getState().mutate((s) => ({
      reservations: s.reservations.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r)),
      tables: s.tables.map((t) => (t.id === res.tableId && t.status === 'RESERVED' ? { ...t, status: 'AVAILABLE' } : t)),
    }));
    return true;
  });

export const seatReservation = (id: string) =>
  write(() => {
    assert('tables.manage');
    findOrThrow(dbSnapshot().reservations, id, 'Reservation');
    useDb.getState().mutate((s) => ({ reservations: s.reservations.map((r) => (r.id === id ? { ...r, status: 'SEATED' } : r)) }));
    return true;
  });

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export const getCustomers = () => read(() => dbSnapshot().customers);

export const createCustomer = (input: { name: string; phone: string; email?: string; notes?: string }) =>
  write(() => {
    assert('customers.manage');
    const name = input.name.trim();
    const phone = input.phone.replace(/\s+/g, '');
    if (!name) throw new ValidationError('Customer name is required.');
    if (!/^\d{7,15}$/.test(phone)) throw new ValidationError('Enter a valid phone number (7–15 digits).');
    if (dbSnapshot().customers.some((c) => c.phone === phone)) throw new ValidationError('A customer with that phone number already exists.');
    const customer: Customer = { id: uid('c'), name, phone, email: input.email?.trim() || undefined, notes: input.notes?.trim() || undefined, loyaltyPoints: 0, joinedAt: new Date().toISOString() };
    useDb.getState().mutate((s) => ({ customers: [customer, ...s.customers] }));
    return customer;
  });

export const updateCustomer = (id: string, patch: Partial<Customer>) =>
  write(() => {
    assert('customers.manage');
    findOrThrow(dbSnapshot().customers, id, 'Customer');
    if (patch.phone !== undefined && !/^\d{7,15}$/.test(patch.phone.replace(/\s+/g, ''))) throw new ValidationError('Enter a valid phone number.');
    useDb.getState().mutate((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    return dbSnapshot().customers.find((c) => c.id === id)!;
  });

export const customerStats = (customerId: string) => {
  const orders = dbSnapshot().orders.filter((o) => o.customerId === customerId);
  const paid = orders.filter((o) => o.paymentStatus === 'PAID');
  return {
    orders: orders.length,
    spend: roundMoney(paid.reduce((sum, o) => sum + o.totals.total, 0)),
    lastVisit: orders.length ? orders.map((o) => o.createdAt).sort().at(-1) : undefined,
  };
};

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export const getIngredients = () => read(() => dbSnapshot().ingredients);
export const getMovements = () => read(() => dbSnapshot().movements);

export const createIngredient = (input: Omit<Ingredient, 'id'>) =>
  write(() => {
    assert('inventory.manage');
    if (!input.name.trim()) throw new ValidationError('Ingredient name is required.');
    if (!input.sku.trim()) throw new ValidationError('SKU is required.');
    if (dbSnapshot().ingredients.some((i) => i.sku.toLowerCase() === input.sku.trim().toLowerCase())) throw new ValidationError('That SKU is already in use.');
    const ingredient: Ingredient = { ...input, id: uid('i'), name: input.name.trim(), sku: input.sku.trim().toUpperCase() };
    useDb.getState().mutate((s) => ({ ingredients: [ingredient, ...s.ingredients] }));
    return ingredient;
  });

export const updateIngredient = (id: string, patch: Partial<Ingredient>) =>
  write(() => {
    assert('inventory.manage');
    findOrThrow(dbSnapshot().ingredients, id, 'Ingredient');
    useDb.getState().mutate((s) => ({ ingredients: s.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
    return dbSnapshot().ingredients.find((i) => i.id === id)!;
  });

export const deleteIngredient = (id: string) =>
  write(() => {
    assert('inventory.manage');
    findOrThrow(dbSnapshot().ingredients, id, 'Ingredient');
    useDb.getState().mutate((s) => ({ ingredients: s.ingredients.filter((i) => i.id !== id) }));
    return true;
  });

export const adjustStock = (input: { ingredientId: string; type: StockMovementType; quantity: number; reason: string }) =>
  write(() => {
    const user = assert('inventory.manage');
    const ingredient = findOrThrow(dbSnapshot().ingredients, input.ingredientId, 'Ingredient');
    if (!input.quantity || input.quantity <= 0) throw new ValidationError('Quantity must be greater than zero.');
    if (!input.reason.trim()) throw new ValidationError('A reason is required.');
    const delta = input.type === 'IN' ? input.quantity : input.type === 'ADJUST' ? input.quantity - ingredient.quantity : -input.quantity;
    const movement: StockMovement = {
      id: uid('mv'), ingredientId: ingredient.id, ingredientName: ingredient.name, type: input.type,
      quantity: input.quantity, reason: input.reason.trim(), at: new Date().toISOString(), by: user.name,
    };
    useDb.getState().mutate((s) => ({
      ingredients: s.ingredients.map((i) => (i.id === ingredient.id ? { ...i, quantity: roundMoney(Math.max(0, input.type === 'ADJUST' ? input.quantity : i.quantity + delta)) } : i)),
      movements: [movement, ...s.movements],
    }));
    return movement;
  });

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

export const getEmployees = () => read(() => dbSnapshot().employees);

export const createEmployee = (input: Omit<Employee, 'id' | 'joinedAt'>) =>
  write(() => {
    assert('employees.manage');
    if (!input.name.trim()) throw new ValidationError('Name is required.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email)) throw new ValidationError('Enter a valid email address.');
    if (dbSnapshot().employees.some((e) => e.email.toLowerCase() === input.email.toLowerCase())) throw new ValidationError('An employee with that email already exists.');
    const employee: Employee = { ...input, name: input.name.trim(), id: uid('u'), joinedAt: new Date().toISOString() };
    useDb.getState().mutate((s) => ({ employees: [employee, ...s.employees] }));
    return employee;
  });

export const updateEmployee = (id: string, patch: Partial<Employee>) =>
  write(() => {
    assert('employees.manage');
    findOrThrow(dbSnapshot().employees, id, 'Employee');
    useDb.getState().mutate((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
    return dbSnapshot().employees.find((e) => e.id === id)!;
  });

export const getBranches = () => read(() => dbSnapshot().branches);
export const getCoupons = () => read(() => dbSnapshot().coupons);

export const validateCoupon = (code: string, subtotal: number) =>
  read(() => {
    const coupon = dbSnapshot().coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
    if (!coupon || !coupon.active) throw new ValidationError('That coupon code is not valid.');
    if (subtotal < coupon.minSubtotal) throw new ValidationError(`This coupon needs a minimum order of ₹${coupon.minSubtotal}.`);
    return coupon as Coupon;
  });

// ---------------------------------------------------------------------------
// Reporting / dashboard (single source of truth for metrics)
// ---------------------------------------------------------------------------

export type ReportRange = 'today' | 'week' | 'month' | 'year';

function inRange(iso: string, range: ReportRange): boolean {
  const d = new Date(iso);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === 'today') return d >= start;
  if (range === 'week') { start.setDate(start.getDate() - 6); return d >= start; }
  if (range === 'month') { start.setDate(1); return d >= start; }
  start.setMonth(0, 1); return d >= start;
}

function paidOrders(orders: Order[], range: ReportRange) {
  return orders.filter((o) => o.paymentStatus === 'PAID' && inRange(o.createdAt, range));
}

export const getReport = (range: ReportRange = 'today') =>
  read<ReportBundle>(() => {
    const db = dbSnapshot();
    const allOrders = db.orders;
    const rangeOrders = allOrders.filter((o) => inRange(o.createdAt, range));
    const paid = paidOrders(allOrders, range);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todays = allOrders.filter((o) => new Date(o.createdAt) >= todayStart);

    const todaySales = roundMoney(paidOrders(allOrders, 'today').reduce((s, o) => s + o.totals.total, 0));
    const avg = paid.length ? roundMoney(paid.reduce((s, o) => s + o.totals.total, 0) / paid.length) : 0;

    // Best sellers within range.
    const sellerMap = new Map<string, { productId: string; name: string; quantity: number; revenue: number }>();
    paid.forEach((o) =>
      o.lines.forEach((l) => {
        const entry = sellerMap.get(l.productId) ?? { productId: l.productId, name: l.name, quantity: 0, revenue: 0 };
        entry.quantity += l.quantity;
        entry.revenue = roundMoney(entry.revenue + l.quantity * l.unitPrice);
        sellerMap.set(l.productId, entry);
      }),
    );
    const bestSellers = [...sellerMap.values()].sort((a, b) => b.quantity - a.quantity);

    // Sales over time (last 7 days trend, or hourly for today).
    const salesOverTime: SalesPoint[] = [];
    if (range === 'today') {
      for (let h = 7; h <= 22; h++) {
        const value = roundMoney(
          paid.filter((o) => new Date(o.createdAt).getHours() === h).reduce((s, o) => s + o.totals.total, 0),
        );
        salesOverTime.push({ label: `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'a' : 'p'}`, value });
      }
    } else {
      const days = range === 'week' ? 7 : 14;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        const value = roundMoney(
          paid.filter((o) => { const t = new Date(o.createdAt); return t >= d && t < next; }).reduce((s, o) => s + o.totals.total, 0),
        );
        salesOverTime.push({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), value });
      }
    }

    // Orders by hour (today).
    const ordersByHour: SalesPoint[] = [];
    for (let h = 7; h <= 22; h++) {
      ordersByHour.push({ label: `${h}:00`, value: todays.filter((o) => new Date(o.createdAt).getHours() === h).length });
    }

    // Sales by category.
    const catName = new Map(db.categories.map((c) => [c.id, c.name]));
    const prodCat = new Map(db.products.map((p) => [p.id, p.categoryId]));
    const catMap = new Map<string, number>();
    paid.forEach((o) => o.lines.forEach((l) => {
      const cat = catName.get(prodCat.get(l.productId) ?? '') ?? 'Other';
      catMap.set(cat, roundMoney((catMap.get(cat) ?? 0) + l.quantity * l.unitPrice));
    }));
    const salesByCategory = [...catMap.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

    // Sales by payment method.
    const payMap = new Map<string, number>();
    paid.forEach((o) => {
      const key = o.paymentMethod ?? 'Unknown';
      payMap.set(key, roundMoney((payMap.get(key) ?? 0) + o.totals.total));
    });
    const salesByPayment = [...payMap.entries()].map(([label, value]) => ({ label: label.charAt(0) + label.slice(1).toLowerCase(), value }));

    // Order status distribution (range).
    const statusOrder: PrepStatus[] = ['NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    const orderStatus = statusOrder.map((s) => ({ label: s.charAt(0) + s.slice(1).toLowerCase(), value: rangeOrders.filter((o) => o.prepStatus === s).length }));

    const discounts = roundMoney(rangeOrders.reduce((s, o) => s + o.totals.discount, 0));
    const refunds = roundMoney(allOrders.filter((o) => o.paymentStatus === 'REFUNDED' && inRange(o.createdAt, range)).reduce((s, o) => s + o.totals.total, 0));

    const lowStockCount = db.ingredients.filter((i) => i.quantity <= i.minThreshold).length;
    const bestSeller = bestSellers[0] ? { name: bestSellers[0].name, quantity: bestSellers[0].quantity } : undefined;

    const rangeLabel = range === 'today' ? 'Today' : range === 'week' ? 'Last 7 days' : range === 'month' ? 'This month' : 'This year';

    return {
      rangeLabel,
      summary: {
        todaySales,
        todayOrders: todays.length,
        averageOrderValue: avg,
        pendingOrders: todays.filter((o) => o.prepStatus === 'NEW' || o.prepStatus === 'PREPARING').length,
        bestSeller,
        lowStockCount,
      },
      salesOverTime,
      ordersByHour,
      bestSellers: bestSellers.slice(0, 8),
      salesByCategory,
      salesByPayment,
      orderStatus,
      discounts,
      refunds,
    };
  }, 320);

export const getDashboard = () => getReport('today');

/** Convenience for pages that need a settings-aware discount preview. */
export function applyDiscountPreview(subtotal: number, discount?: Discount) {
  return discountAmountFor(discount, subtotal);
}

export const apiHelpers = { roundMoney, discountAmountFor, computeTotals };
