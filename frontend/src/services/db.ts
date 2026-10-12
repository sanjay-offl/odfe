// Persisted in-browser "database" for DEMO MODE.
// It is intentionally the only place demo entities live, so the async service layer in
// ./api.ts can be replaced by real HTTP calls without touching any page/component.
import { create } from 'zustand';
import type {
  Branch, CafeTable, Category, Coupon, Customer, Employee, Ingredient, Order, Product, Reservation,
  Settings, StockMovement,
} from '../types';
import {
  branches, categories, coupons, customers, defaultSettings, employees, generateHistoricalOrders,
  generateStockMovements, ingredients, products, reservations, seedTablesWithOrders,
} from '../data/seed';

const STORAGE_KEY = 'odfe-demo-db-v1';

export interface DbData {
  categories: Category[];
  products: Product[];
  tables: CafeTable[];
  reservations: Reservation[];
  customers: Customer[];
  orders: Order[];
  ingredients: Ingredient[];
  movements: StockMovement[];
  employees: Employee[];
  branches: Branch[];
  coupons: Coupon[];
  settings: Settings;
}

export function buildSeed(): DbData {
  const orders = generateHistoricalOrders();
  return {
    categories: structuredClone(categories),
    products: structuredClone(products),
    tables: seedTablesWithOrders(orders),
    reservations: structuredClone(reservations),
    customers: structuredClone(customers),
    orders,
    ingredients: structuredClone(ingredients),
    movements: generateStockMovements(),
    employees: structuredClone(employees),
    branches: structuredClone(branches),
    coupons: structuredClone(coupons),
    settings: structuredClone(defaultSettings),
  };
}

function load(): DbData {
  if (typeof localStorage === 'undefined') return buildSeed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeed();
    const parsed = JSON.parse(raw) as Partial<DbData>;
    const seed = buildSeed();
    // Merge so newly added seed fields appear after schema changes.
    return { ...seed, ...parsed } as DbData;
  } catch {
    return buildSeed();
  }
}

function persist(data: DbData) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage full / unavailable — demo continues in memory */
  }
}

interface DbStore extends DbData {
  /** Apply a pure recipe to the data and persist. */
  mutate: (recipe: (data: DbData) => Partial<DbData> | void) => void;
  reset: () => void;
  /** Re-read persisted data (used by secondary screens such as the customer display). */
  reload: () => void;
  hydrated: boolean;
}

const initial = load();

export const useDb = create<DbStore>((set, get) => ({
  ...initial,
  hydrated: true,
  mutate: (recipe) =>
    set((state) => {
      const next = recipe(state) ?? {};
      const merged = { ...state, ...next } as DbStore;
      persist({
        categories: merged.categories,
        products: merged.products,
        tables: merged.tables,
        reservations: merged.reservations,
        customers: merged.customers,
        orders: merged.orders,
        ingredients: merged.ingredients,
        movements: merged.movements,
        employees: merged.employees,
        branches: merged.branches,
        coupons: merged.coupons,
        settings: merged.settings,
      });
      return merged as Partial<DbStore>;
    }),
  reset: () => {
    const seed = buildSeed();
    persist(seed);
    set({ ...seed, hydrated: get().hydrated });
  },
  reload: () => set({ ...load(), hydrated: true }),
}));

export function dbSnapshot(): DbData {
  const s = useDb.getState();
  return {
    categories: s.categories, products: s.products, tables: s.tables, reservations: s.reservations,
    customers: s.customers, orders: s.orders, ingredients: s.ingredients, movements: s.movements,
    employees: s.employees, branches: s.branches, coupons: s.coupons, settings: s.settings,
  };
}
