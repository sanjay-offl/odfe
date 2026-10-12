import { create } from 'zustand';
import type { CartLine, Coupon, Customer, HeldOrder, OrderType, Product } from '../types';
import { cartCount, computeTotals, discountAmountFor, makeLine, type Discount } from '../lib/pricing';
import { uid } from '../lib/id';

const CART_KEY = 'odfe-cart-v1';

export interface CartState {
  lines: CartLine[];
  orderType: OrderType;
  tableId?: string;
  customer?: Customer;
  discount?: Discount;
  notes: string;
  held: HeldOrder[];
  /** Adds a product; opens customization upstream when the product has options. */
  addLine: (product: Product, options?: { sizeId?: string; addons?: CartLine['addons']; notes?: string; quantity?: number }) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  updateLine: (lineId: string, patch: Partial<Pick<CartLine, 'addons' | 'notes' | 'sizeId' | 'sizeName' | 'sizePrice' | 'unitPrice' | 'quantity'>>) => void;
  clear: () => void;
  setOrderType: (type: OrderType) => void;
  setTable: (tableId?: string) => void;
  setCustomer: (customer?: Customer) => void;
  setDiscount: (discount?: Discount) => void;
  setNotes: (notes: string) => void;
  hold: (label: string) => void;
  resume: (id: string) => void;
  deleteHeld: (id: string) => void;
  loadHeld: (held: HeldOrder) => void;
}

interface Persisted {
  lines: CartLine[];
  orderType: OrderType;
  tableId?: string;
  customer?: Customer;
  discount?: Discount;
  notes: string;
  held: HeldOrder[];
}

function load(): Persisted {
  const base: Persisted = { lines: [], orderType: 'DINE_IN', tableId: undefined, customer: undefined, discount: undefined, notes: '', held: [] };
  if (typeof localStorage === 'undefined') return base;
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? { ...base, ...(JSON.parse(raw) as Persisted) } : base;
  } catch {
    return base;
  }
}

function save(state: CartState) {
  if (typeof localStorage === 'undefined') return;
  try {
    const data: Persisted = {
      lines: state.lines, orderType: state.orderType, tableId: state.tableId,
      customer: state.customer, discount: state.discount, notes: state.notes, held: state.held,
    };
    localStorage.setItem(CART_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export const useCart = create<CartState>((set, get) => {
  const commit = (partial: Partial<CartState>) => {
    set(partial as CartState);
    save(get());
  };
  return {
    ...load(),

    addLine: (product, options = {}) => {
      const quantity = options.quantity ?? 1;
      const sameConfig = get().lines.find(
        (l) =>
          l.productId === product.id &&
          (l.sizeId ?? '') === (options.sizeId ?? '') &&
          !l.notes &&
          !options.notes &&
          JSON.stringify(l.addons.map((a) => a.id).sort()) === JSON.stringify((options.addons ?? []).map((a) => a.id).sort()),
      );
      if (sameConfig) {
        commit({ lines: get().lines.map((l) => (l.lineId === sameConfig.lineId ? { ...l, quantity: l.quantity + quantity } : l)) });
        return;
      }
      const line = makeLine({ product, quantity, sizeId: options.sizeId, addons: options.addons, notes: options.notes, lineId: uid('line') });
      commit({ lines: [...get().lines, line] });
    },

    setQuantity: (lineId, quantity) =>
      commit({
        lines:
          quantity <= 0
            ? get().lines.filter((l) => l.lineId !== lineId)
            : get().lines.map((l) => (l.lineId === lineId ? { ...l, quantity: Math.min(99, Math.round(quantity)) } : l)),
      }),

    removeLine: (lineId) => commit({ lines: get().lines.filter((l) => l.lineId !== lineId) }),

    updateLine: (lineId, patch) =>
      commit({ lines: get().lines.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l)) }),

    clear: () => commit({ lines: [], customer: undefined, discount: undefined, notes: '', tableId: undefined }),

    setOrderType: (orderType) => commit({ orderType, tableId: orderType === 'DINE_IN' ? get().tableId : undefined }),
    setTable: (tableId) => commit({ tableId }),
    setCustomer: (customer) => commit({ customer }),
    setDiscount: (discount) => commit({ discount }),
    setNotes: (notes) => commit({ notes }),

    hold: (label) => {
      const { lines, customer, orderType, tableId, notes, held } = get();
      if (!lines.length) return;
      const entry: HeldOrder = { id: uid('hold'), label: label || `Hold ${held.length + 1}`, lines, customer, orderType, tableId, notes, at: new Date().toISOString() };
      commit({ held: [entry, ...held], lines: [], customer: undefined, discount: undefined, notes: '', tableId: undefined });
    },

    resume: (id) => {
      const entry = get().held.find((h) => h.id === id);
      if (!entry) return;
      commit({ held: get().held.filter((h) => h.id !== id), lines: entry.lines, customer: entry.customer, orderType: entry.orderType, tableId: entry.tableId, notes: entry.notes, discount: undefined });
    },

    loadHeld: (held) => commit({ lines: held.lines, customer: held.customer, orderType: held.orderType, tableId: held.tableId, notes: held.notes, discount: undefined }),

    deleteHeld: (id) => commit({ held: get().held.filter((h) => h.id !== id) }),
  };
});

/** Live totals for the current cart using settings-driven tax + service charge. */
export function cartTotals(settings: { taxRate: number; serviceChargeEnabled: boolean; serviceChargeRate: number }) {
  const { lines, discount } = useCart.getState();
  return computeTotals({
    lines,
    discount,
    taxRate: settings.taxRate,
    serviceChargeEnabled: settings.serviceChargeEnabled,
    serviceChargeRate: settings.serviceChargeRate,
  });
}

export function previewDiscount(coupon: Coupon, subtotal: number): Discount | undefined {
  if (!coupon.active || subtotal < coupon.minSubtotal) return undefined;
  return { type: coupon.type, value: coupon.value, code: coupon.code };
}

export { cartCount, discountAmountFor };
