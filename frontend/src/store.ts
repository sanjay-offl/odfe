import { create } from 'zustand';
import type { CartLine, Product, Role, User } from './types';

type AuthState = { user: User | null; login: (user: User) => void; logout: () => void };
export const useAuth = create<AuthState>((set) => ({
  user: sessionStorage.getItem('odfe-user') ? JSON.parse(sessionStorage.getItem('odfe-user')!) : null,
  login: (user) => { sessionStorage.setItem('odfe-user', JSON.stringify(user)); set({ user }); },
  logout: () => { sessionStorage.removeItem('odfe-user'); sessionStorage.removeItem('odfe-token'); set({ user: null }); }
}));

type PosState = { cart: CartLine[]; add: (product: Product) => void; change: (id: string, quantity: number) => void; clear: () => void };
export const usePos = create<PosState>((set) => ({
  cart: [],
  add: (product) => set((state) => {
    const found = state.cart.find((line) => line.product.id === product.id);
    return { cart: found ? state.cart.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line) : [...state.cart, { product, quantity: 1 }] };
  }),
  change: (id, quantity) => set((state) => ({ cart: quantity > 0 ? state.cart.map((line) => line.product.id === id ? { ...line, quantity } : line) : state.cart.filter((line) => line.product.id !== id) })),
  clear: () => set({ cart: [] })
}));

export const roleLabel = (role: Role) => role === 'ADMIN' ? 'Admin' : 'Cashier';
