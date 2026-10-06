export type Role = 'ADMIN' | 'EMPLOYEE';
export type Category = { id: string; name: string; color: string };
export type Product = { id: string; name: string; category: Category; price: number; description: string; sendToKitchen: boolean };
export type CartLine = { product: Product; quantity: number };
export type User = { name: string; email: string; role: Role };
