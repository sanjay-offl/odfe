import { create } from 'zustand';
import type { CartLine, Customer, Order, Product, Role, User } from './types';

type AuthState = { user: User | null; login: (user: User) => void; logout: () => void };
export const useAuth = create<AuthState>((set) => ({
  user: sessionStorage.getItem('odfe-user') ? JSON.parse(sessionStorage.getItem('odfe-user')!) : null,
  login: (user) => { sessionStorage.setItem('odfe-user', JSON.stringify(user)); set({ user }); },
  logout: () => { sessionStorage.removeItem('odfe-user'); sessionStorage.removeItem('odfe-token'); set({ user: null }); }
}));

type PosState = { cart: CartLine[]; customer?: Customer; discount: number; orders: Order[]; add: (product: Product) => void; change: (id: string, quantity: number) => void; setCustomer: (customer?: Customer) => void; setDiscount: (discount: number) => void; sendToKitchen: (table: number) => Order | undefined; markPaid: (id: string, paymentMethod: string) => void; updateOrder: (id: string, status: Order['status']) => void; clear: () => void };
export const usePos = create<PosState>((set) => ({
  cart: [],
  customer: undefined,
  discount: 0,
  orders: JSON.parse(localStorage.getItem('odfe-orders') || '[]'),
  add: (product) => set((state) => {
    const found = state.cart.find((line) => line.product.id === product.id);
    return { cart: found ? state.cart.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line) : [...state.cart, { product, quantity: 1 }] };
  }),
  change: (id, quantity) => set((state) => ({ cart: quantity > 0 ? state.cart.map((line) => line.product.id === id ? { ...line, quantity } : line) : state.cart.filter((line) => line.product.id !== id) })),
  setCustomer: (customer) => set({ customer }),
  setDiscount: (discount) => set({ discount }),
  sendToKitchen: (table) => {
    let created: Order | undefined;
    set((state) => {
      if (!state.cart.length) return state;
      const subtotal = state.cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
      const tax = subtotal * 0.085;
      created = { id: String(1048 + state.orders.length), table, customer: state.customer, lines: state.cart, subtotal, tax, discount: state.discount, total: subtotal + tax - state.discount, status: 'To Cook', createdAt: new Date().toISOString() };
      const orders = [...state.orders, created];
      localStorage.setItem('odfe-orders', JSON.stringify(orders));
      localStorage.setItem('odfe-customer-display', JSON.stringify(created));
      return { orders, cart: [], customer: undefined, discount: 0 };
    });
    return created;
  },
  markPaid: (id, paymentMethod) => set((state) => {
    const orders = state.orders.map(order => order.id === id ? { ...order, paymentMethod } : order);
    localStorage.setItem('odfe-orders', JSON.stringify(orders));
    localStorage.setItem('odfe-customer-display', JSON.stringify({ ...orders.find(order => order.id === id), displayStatus: 'complete' }));
    return { orders };
  }),
  updateOrder: (id, status) => set((state) => {
    const orders = state.orders.map(order => order.id === id ? { ...order, status } : order);
    localStorage.setItem('odfe-orders', JSON.stringify(orders));
    localStorage.setItem('odfe-customer-display', JSON.stringify(orders.find(order => order.id === id)));
    return { orders };
  }),
  clear: () => set({ cart: [], customer: undefined, discount: 0 })
}));

export const roleLabel = (role: Role) => role === 'ADMIN' ? 'Admin' : 'Cashier';
