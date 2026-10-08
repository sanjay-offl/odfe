export type Role = 'ADMIN' | 'EMPLOYEE';
export type Category = { id: string; name: string; color: string };
export type Product = { id: string; name: string; category: Category; price: number; description: string; sendToKitchen: boolean };
export type CartLine = { product: Product; quantity: number };
export type User = { name: string; email: string; role: Role };
export type Customer = { id: string; name: string; email: string; phone: string };
export type OrderStatus = 'Draft' | 'To Cook' | 'Preparing' | 'Completed' | 'Paid' | 'Cancelled';
export type Order = { id: string; table: number; customer?: Customer; lines: CartLine[]; subtotal: number; tax: number; discount: number; total: number; status: OrderStatus; paymentMethod?: string; createdAt: string };
