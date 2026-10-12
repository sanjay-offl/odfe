import { computeTotals, makeLine, roundMoney } from '../lib/pricing';
import { uid } from '../lib/id';
import type {
  Branch, CafeTable, Category, Coupon, Customer, Employee, Ingredient, Order, OrderType,
  PaymentMethod, PrepStatus, Product, Reservation, Settings, StockMovement,
} from '../types';
import { PRODUCT_IMAGES } from './images';

const size = (id: string, name: string, priceDelta: number) => ({ id, name, priceDelta });
const addon = (id: string, name: string, price: number) => ({ id, name, price });

export const categories: Category[] = [
  { id: 'cat_coffee', name: 'Coffee', color: '#C47F3B', sortOrder: 1, active: true },
  { id: 'cat_tea', name: 'Tea', color: '#6B8F71', sortOrder: 2, active: true },
  { id: 'cat_cold', name: 'Cold Drinks', color: '#638BA8', sortOrder: 3, active: true },
  { id: 'cat_breakfast', name: 'Breakfast', color: '#D9A441', sortOrder: 4, active: true },
  { id: 'cat_sandwich', name: 'Sandwiches', color: '#8C6D46', sortOrder: 5, active: true },
  { id: 'cat_mains', name: 'Mains', color: '#B4452F', sortOrder: 6, active: true },
  { id: 'cat_bakery', name: 'Bakery', color: '#B07A4B', sortOrder: 7, active: true },
  { id: 'cat_dessert', name: 'Desserts', color: '#9B5D7A', sortOrder: 8, active: true },
  { id: 'cat_snacks', name: 'Snacks', color: '#7A8B4F', sortOrder: 9, active: true },
];

const P = (p: Omit<Product, 'sizes' | 'addons'> & Partial<Pick<Product, 'sizes' | 'addons'>>): Product => ({
  sizes: [],
  addons: [],
  archived: false,
  ...p,
});

export const products: Product[] = [
  P({ id: 'p_cappuccino', name: 'Cappuccino', description: 'Double espresso, steamed milk and silky foam', categoryId: 'cat_coffee', price: 180, image: PRODUCT_IMAGES.cappuccino, available: true, sendToKitchen: true, prepMinutes: 3, dietary: 'VEG', popular: true,
    sizes: [size('reg', 'Regular', 0), size('lg', 'Large', 40)], addons: [addon('a_extra', 'Extra shot', 35), addon('a_oat', 'Oat milk', 30), addon('a_van', 'Vanilla syrup', 25)] }),
  P({ id: 'p_flatwhite', name: 'Flat White', description: 'Velvety microfoam over a double ristretto', categoryId: 'cat_coffee', price: 190, image: PRODUCT_IMAGES.flatwhite, available: true, sendToKitchen: true, prepMinutes: 3, dietary: 'VEG', popular: true,
    sizes: [size('reg', 'Regular', 0), size('lg', 'Large', 40)], addons: [addon('a_extra', 'Extra shot', 35), addon('a_oat', 'Oat milk', 30)] }),
  P({ id: 'p_espresso', name: 'Espresso', description: 'Single-origin double shot, rich and bold', categoryId: 'cat_coffee', price: 120, image: PRODUCT_IMAGES.espresso, available: true, sendToKitchen: true, prepMinutes: 2, dietary: 'VEG',
    addons: [addon('a_extra', 'Extra shot', 35)] }),
  P({ id: 'p_latte', name: 'Cafe Latte', description: 'Smooth espresso with lightly steamed milk', categoryId: 'cat_coffee', price: 200, image: PRODUCT_IMAGES.latte, available: true, sendToKitchen: true, prepMinutes: 3, dietary: 'VEG',
    sizes: [size('reg', 'Regular', 0), size('lg', 'Large', 40)], addons: [addon('a_extra', 'Extra shot', 35), addon('a_oat', 'Oat milk', 30), addon('a_caramel', 'Caramel', 30)] }),
  P({ id: 'p_mocha', name: 'Cafe Mocha', description: 'Espresso, dark chocolate and steamed milk', categoryId: 'cat_coffee', price: 220, image: PRODUCT_IMAGES.mocha, available: true, sendToKitchen: true, prepMinutes: 4, dietary: 'VEG', popular: true,
    sizes: [size('reg', 'Regular', 0), size('lg', 'Large', 40)], addons: [addon('a_extra', 'Extra shot', 35), addon('a_cream', 'Whipped cream', 40)] }),
  P({ id: 'p_matcha', name: 'Matcha Latte', description: 'Stone-ground matcha with steamed milk', categoryId: 'cat_tea', price: 230, image: PRODUCT_IMAGES.matcha, available: true, sendToKitchen: true, prepMinutes: 4, dietary: 'VEG',
    addons: [addon('a_oat', 'Oat milk', 30), addon('a_honey', 'Honey', 20)] }),
  P({ id: 'p_masalatea', name: 'Masala Chai', description: 'Spiced black tea simmered with milk', categoryId: 'cat_tea', price: 110, image: PRODUCT_IMAGES.masalatea, available: true, sendToKitchen: true, prepMinutes: 4, dietary: 'VEG', popular: true }),
  P({ id: 'p_greentea', name: 'Green Tea', description: 'Delicate loose-leaf green tea', categoryId: 'cat_tea', price: 130, image: PRODUCT_IMAGES.greentea, available: true, sendToKitchen: true, prepMinutes: 4, dietary: 'VEGAN' }),
  P({ id: 'p_lemontea', name: 'Iced Lemon Tea', description: 'Black tea, lemon and crushed ice', categoryId: 'cat_cold', price: 150, image: PRODUCT_IMAGES.lemontea, available: true, sendToKitchen: true, prepMinutes: 3, dietary: 'VEGAN' }),
  P({ id: 'p_coldbrew', name: 'Cold Brew', description: 'Slow-steeped for 16 hours, smooth and bright', categoryId: 'cat_cold', price: 210, image: PRODUCT_IMAGES.coldbrew, available: true, sendToKitchen: true, prepMinutes: 2, dietary: 'VEG', popular: true,
    sizes: [size('reg', 'Regular', 0), size('lg', 'Large', 40)], addons: [addon('a_ice', 'Extra ice', 0), addon('a_oat', 'Oat milk', 30)] }),
  P({ id: 'p_icedlatte', name: 'Iced Latte', description: 'Chilled espresso with milk over ice', categoryId: 'cat_cold', price: 195, image: PRODUCT_IMAGES.icedlatte, available: true, sendToKitchen: true, prepMinutes: 3, dietary: 'VEG',
    addons: [addon('a_extra', 'Extra shot', 35), addon('a_van', 'Vanilla syrup', 25)] }),
  P({ id: 'p_smoothie', name: 'Berry Smoothie', description: 'Mixed berries, yoghurt and honey', categoryId: 'cat_cold', price: 240, image: PRODUCT_IMAGES.smoothie, available: true, sendToKitchen: false, prepMinutes: 5, dietary: 'VEG' }),
  P({ id: 'p_oj', name: 'Fresh Orange Juice', description: 'Cold-pressed, no added sugar', categoryId: 'cat_cold', price: 160, image: PRODUCT_IMAGES.orangejuice, available: true, sendToKitchen: false, prepMinutes: 3, dietary: 'VEGAN' }),
  P({ id: 'p_avocado', name: 'Avocado Toast', description: 'Sourdough, smashed avocado, lemon and chilli', categoryId: 'cat_breakfast', price: 290, image: PRODUCT_IMAGES.avocadotoast, available: true, sendToKitchen: true, prepMinutes: 8, dietary: 'VEGAN', popular: true,
    addons: [addon('a_egg', 'Poached egg', 50), addon('a_feta', 'Feta', 60)] }),
  P({ id: 'p_granola', name: 'Granola Bowl', description: 'Greek yoghurt, berries, honey and toasted oats', categoryId: 'cat_breakfast', price: 260, image: PRODUCT_IMAGES.granola, available: true, sendToKitchen: false, prepMinutes: 5, dietary: 'VEG' }),
  P({ id: 'p_pancakes', name: 'Buttermilk Pancakes', description: 'Maple syrup, berries and whipped butter', categoryId: 'cat_breakfast', price: 320, image: PRODUCT_IMAGES.pancakes, available: true, sendToKitchen: true, prepMinutes: 12, dietary: 'VEG', popular: true }),
  P({ id: 'p_omelette', name: 'Masala Omelette', description: 'Three eggs, onion, tomato and coriander', categoryId: 'cat_breakfast', price: 250, image: PRODUCT_IMAGES.omelette, available: true, sendToKitchen: true, prepMinutes: 9, dietary: 'EGG' }),
  P({ id: 'p_sandwich', name: 'Grilled Veg Sandwich', description: 'Roast veg, pesto and mozzarella on ciabatta', categoryId: 'cat_sandwich', price: 280, image: PRODUCT_IMAGES.sandwich, available: true, sendToKitchen: true, prepMinutes: 9, dietary: 'VEG' }),
  P({ id: 'p_club', name: 'Chicken Club', description: 'Grilled chicken, bacon, lettuce and aioli', categoryId: 'cat_sandwich', price: 360, image: PRODUCT_IMAGES.club, available: true, sendToKitchen: true, prepMinutes: 11, dietary: 'NON_VEG' }),
  P({ id: 'p_paneerwrap', name: 'Paneer Tikka Wrap', description: 'Spiced paneer, peppers and mint chutney', categoryId: 'cat_sandwich', price: 310, image: PRODUCT_IMAGES.paneerwrap, available: true, sendToKitchen: true, prepMinutes: 10, dietary: 'VEG', popular: true }),
  P({ id: 'p_burger', name: 'Classic Burger', description: 'Beef patty, cheddar, pickles and house sauce', categoryId: 'cat_mains', price: 420, image: PRODUCT_IMAGES.burger, available: true, sendToKitchen: true, prepMinutes: 14, dietary: 'NON_VEG',
    addons: [addon('a_cheese', 'Extra cheese', 40), addon('a_fries', 'Side fries', 90)] }),
  P({ id: 'p_pizza', name: 'Margherita Pizza', description: 'San Marzano tomato, basil and fior di latte', categoryId: 'cat_mains', price: 450, image: PRODUCT_IMAGES.pizza, available: false, sendToKitchen: true, prepMinutes: 16, dietary: 'VEG',
    sizes: [size('sm', 'Small 8"', 0), size('lg', 'Large 12"', 180)] }),
  P({ id: 'p_salad', name: 'Garden Salad', description: 'Seasonal leaves, cucumber, seeds and vinaigrette', categoryId: 'cat_mains', price: 280, image: PRODUCT_IMAGES.salad, available: true, sendToKitchen: false, prepMinutes: 5, dietary: 'VEGAN' }),
  P({ id: 'p_soup', name: 'Tomato Basil Soup', description: 'Slow-roasted tomatoes with fresh basil', categoryId: 'cat_mains', price: 220, image: PRODUCT_IMAGES.soup, available: true, sendToKitchen: true, prepMinutes: 7, dietary: 'VEG' }),
  P({ id: 'p_croissant', name: 'Butter Croissant', description: 'Laminated daily, flaky and golden', categoryId: 'cat_bakery', price: 150, image: PRODUCT_IMAGES.croissant, available: true, sendToKitchen: true, prepMinutes: 2, dietary: 'VEG', popular: true, trackStock: true, stockQty: 6 }),
  P({ id: 'p_muffin', name: 'Blueberry Muffin', description: 'Bursting with berries, soft crumb', categoryId: 'cat_bakery', price: 140, image: PRODUCT_IMAGES.muffin, available: true, sendToKitchen: false, prepMinutes: 2, dietary: 'VEG', trackStock: true, stockQty: 4 }),
  P({ id: 'p_bagel', name: 'Sesame Bagel', description: 'Wood-fired bagel with cream cheese', categoryId: 'cat_bakery', price: 160, image: PRODUCT_IMAGES.bagel, available: true, sendToKitchen: true, prepMinutes: 4, dietary: 'VEG' }),
  P({ id: 'p_brownie', name: 'Fudge Brownie', description: 'Dark chocolate, fudgy centre, sea salt', categoryId: 'cat_dessert', price: 190, image: PRODUCT_IMAGES.brownie, available: true, sendToKitchen: false, prepMinutes: 2, dietary: 'VEG', popular: true }),
  P({ id: 'p_cheesecake', name: 'New York Cheesecake', description: 'Baked vanilla cheesecake, berry compote', categoryId: 'cat_dessert', price: 260, image: PRODUCT_IMAGES.cheesecake, available: true, sendToKitchen: false, prepMinutes: 2, dietary: 'VEG' }),
  P({ id: 'p_cake', name: 'Chocolate Cake Slice', description: 'Layered chocolate sponge and ganache', categoryId: 'cat_dessert', price: 240, image: PRODUCT_IMAGES.cake, available: true, sendToKitchen: false, prepMinutes: 2, dietary: 'VEG' }),
  P({ id: 'p_donut', name: 'Glazed Donut', description: 'Soft dough, vanilla glaze', categoryId: 'cat_dessert', price: 120, image: PRODUCT_IMAGES.donut, available: true, sendToKitchen: false, prepMinutes: 1, dietary: 'VEG' }),
  P({ id: 'p_cookies', name: 'Choc Chip Cookies', description: 'Warm, chewy, baked twice a day', categoryId: 'cat_snacks', price: 110, image: PRODUCT_IMAGES.cookies, available: true, sendToKitchen: false, prepMinutes: 1, dietary: 'VEG' }),
  P({ id: 'p_fries', name: 'Loaded Fries', description: 'Crispy fries, cheese sauce and jalapeños', categoryId: 'cat_snacks', price: 220, image: PRODUCT_IMAGES.burger, available: true, sendToKitchen: true, prepMinutes: 8, dietary: 'VEG' }),
  P({ id: 'p_water', name: 'Still Water', description: '500ml bottled mineral water', categoryId: 'cat_cold', price: 60, image: PRODUCT_IMAGES.water, available: true, sendToKitchen: false, prepMinutes: 1, dietary: 'VEGAN' }),
];

export const branches: Branch[] = [
  { id: 'br_main', name: 'ODFE Indiranagar', address: '12th Main, Indiranagar, Bengaluru' },
  { id: 'br_airport', name: 'ODFE Airport T2', address: 'Kempegowda Intl. Airport, Bengaluru' },
];

export const tables: CafeTable[] = [
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ id: `t_${n}`, number: n, capacity: n % 2 === 0 ? 4 : 2, section: 'Main floor', status: 'AVAILABLE' as const })),
  ...[7, 8, 9, 10].map((n) => ({ id: `t_${n}`, number: n, capacity: 4, section: 'Patio', status: 'AVAILABLE' as const })),
  ...[11, 12].map((n) => ({ id: `t_${n}`, number: n, capacity: 6, section: 'Terrace', status: 'AVAILABLE' as const })),
];

export const customers: Customer[] = [
  { id: 'c_1', name: 'Ananya Rao', phone: '9845012345', email: 'ananya@example.com', loyaltyPoints: 320, joinedAt: '2024-11-02T09:00:00.000Z' },
  { id: 'c_2', name: 'Rahul Mehta', phone: '9820011223', email: 'rahul@example.com', loyaltyPoints: 145, joinedAt: '2025-01-14T09:00:00.000Z' },
  { id: 'c_3', name: 'Sara Fernandes', phone: '9900112233', email: 'sara@example.com', loyaltyPoints: 610, joinedAt: '2024-08-21T09:00:00.000Z', notes: 'Prefers oat milk' },
  { id: 'c_4', name: 'Vikram Singh', phone: '9765432109', email: 'vikram@example.com', loyaltyPoints: 90, joinedAt: '2025-03-05T09:00:00.000Z' },
  { id: 'c_5', name: 'Meera Nair', phone: '9632587410', email: 'meera@example.com', loyaltyPoints: 240, joinedAt: '2024-12-11T09:00:00.000Z' },
  { id: 'c_6', name: 'Arjun Kapoor', phone: '9512368470', loyaltyPoints: 55, joinedAt: '2025-05-19T09:00:00.000Z' },
  { id: 'c_7', name: 'Priya Menon', phone: '9448822001', email: 'priya@example.com', loyaltyPoints: 780, joinedAt: '2024-06-02T09:00:00.000Z' },
  { id: 'c_8', name: 'Karan Shah', phone: '9333001122', loyaltyPoints: 15, joinedAt: '2025-06-30T09:00:00.000Z' },
];

export const ingredients: Ingredient[] = [
  { id: 'i_beans', name: 'Espresso Beans', sku: 'BEAN-001', unit: 'kg', quantity: 8.5, minThreshold: 5, supplier: 'Blue Tokai', costPerUnit: 1450, expiry: '2026-06-01', category: 'Coffee' },
  { id: 'i_milk', name: 'Whole Milk', sku: 'MILK-001', unit: 'L', quantity: 24, minThreshold: 30, supplier: 'Nandini', costPerUnit: 62, expiry: '2026-04-02', category: 'Dairy' },
  { id: 'i_oat', name: 'Oat Milk', sku: 'OAT-001', unit: 'L', quantity: 6, minThreshold: 8, supplier: 'Urban Platter', costPerUnit: 210, expiry: '2026-05-12', category: 'Dairy' },
  { id: 'i_sugar', name: 'Cane Sugar', sku: 'SUG-001', unit: 'kg', quantity: 12, minThreshold: 4, supplier: 'Local', costPerUnit: 55, category: 'Pantry' },
  { id: 'i_matcha', name: 'Matcha Powder', sku: 'MAT-001', unit: 'g', quantity: 420, minThreshold: 300, supplier: 'Kenko', costPerUnit: 9, expiry: '2026-07-20', category: 'Tea' },
  { id: 'i_tealeaf', name: 'Black Tea Leaves', sku: 'TEA-001', unit: 'g', quantity: 900, minThreshold: 500, supplier: 'Chai Point', costPerUnit: 1.8, category: 'Tea' },
  { id: 'i_bread', name: 'Sourdough Loaf', sku: 'BRD-001', unit: 'pcs', quantity: 7, minThreshold: 6, supplier: 'Bakehouse', costPerUnit: 180, expiry: '2026-04-16', category: 'Bakery' },
  { id: 'i_avocado', name: 'Avocado', sku: 'AVO-001', unit: 'pcs', quantity: 14, minThreshold: 20, supplier: 'Fresh Farm', costPerUnit: 95, expiry: '2026-04-15', category: 'Produce' },
  { id: 'i_tomato', name: 'Tomatoes', sku: 'TOM-001', unit: 'kg', quantity: 9, minThreshold: 5, supplier: 'Fresh Farm', costPerUnit: 45, expiry: '2026-04-18', category: 'Produce' },
  { id: 'i_chicken', name: 'Chicken Breast', sku: 'CHK-001', unit: 'kg', quantity: 4.2, minThreshold: 3, supplier: 'Meatly', costPerUnit: 340, expiry: '2026-04-14', category: 'Meat' },
  { id: 'i_paneer', name: 'Paneer', sku: 'PAN-001', unit: 'kg', quantity: 2.4, minThreshold: 3, supplier: 'Amul', costPerUnit: 420, expiry: '2026-04-17', category: 'Dairy' },
  { id: 'i_cheese', name: 'Mozzarella', sku: 'CHZ-001', unit: 'kg', quantity: 3.1, minThreshold: 2, supplier: 'Amul', costPerUnit: 460, expiry: '2026-05-01', category: 'Dairy' },
  { id: 'i_flour', name: 'Bread Flour', sku: 'FLR-001', unit: 'kg', quantity: 18, minThreshold: 10, supplier: 'Local', costPerUnit: 60, category: 'Pantry' },
  { id: 'i_butter', name: 'Unsalted Butter', sku: 'BTR-001', unit: 'kg', quantity: 1.8, minThreshold: 2.5, supplier: 'Amul', costPerUnit: 560, expiry: '2026-06-10', category: 'Dairy' },
  { id: 'i_cup12', name: '12oz Paper Cups', sku: 'CUP-012', unit: 'pack', quantity: 22, minThreshold: 10, supplier: 'EcoPack', costPerUnit: 240, category: 'Packaging' },
  { id: 'i_lids', name: 'Cup Lids', sku: 'LID-001', unit: 'pack', quantity: 5, minThreshold: 8, supplier: 'EcoPack', costPerUnit: 180, category: 'Packaging' },
];

export const employees: Employee[] = [
  { id: 'u_admin', name: 'Aditya Sharma', email: 'admin@odfe.cafe', role: 'ADMIN', phone: '9845000001', active: true, branchId: 'br_main', joinedAt: '2023-01-10T09:00:00.000Z' },
  { id: 'u_manager', name: 'Neha Gupta', email: 'manager@odfe.cafe', role: 'MANAGER', phone: '9845000002', active: true, branchId: 'br_main', joinedAt: '2023-04-02T09:00:00.000Z' },
  { id: 'u_cashier', name: 'Jamie Lee', email: 'cashier@odfe.cafe', role: 'CASHIER', phone: '9845000003', active: true, branchId: 'br_main', joinedAt: '2024-02-18T09:00:00.000Z' },
  { id: 'u_cashier2', name: 'Fatima Khan', email: 'fatima@odfe.cafe', role: 'CASHIER', phone: '9845000004', active: true, branchId: 'br_main', joinedAt: '2024-09-01T09:00:00.000Z' },
  { id: 'u_kitchen', name: 'Marco Rossi', email: 'kitchen@odfe.cafe', role: 'KITCHEN', phone: '9845000005', active: true, branchId: 'br_main', joinedAt: '2024-05-20T09:00:00.000Z' },
  { id: 'u_kitchen2', name: 'Divya Pillai', email: 'divya@odfe.cafe', role: 'KITCHEN', phone: '9845000006', active: true, branchId: 'br_main', joinedAt: '2025-01-08T09:00:00.000Z' },
];

export const coupons: Coupon[] = [
  { code: 'WELCOME10', label: '10% off the whole order', type: 'PERCENT', value: 10, minSubtotal: 0, active: true },
  { code: 'FLAT50', label: '₹50 off orders above ₹300', type: 'FLAT', value: 50, minSubtotal: 300, active: true },
  { code: 'MORNING15', label: '15% off orders above ₹500', type: 'PERCENT', value: 15, minSubtotal: 500, active: true },
];

export const defaultSettings: Settings = {
  cafeName: 'ODFE Coffee Roasters',
  tagline: 'Specialty coffee & kitchen',
  currency: 'INR',
  locale: 'en-IN',
  taxRate: 0.05,
  taxInclusive: false,
  serviceChargeEnabled: true,
  serviceChargeRate: 0.05,
  orderPrefix: 'OD',
  nextOrderNumber: 1001,
  receiptHeader: 'Thank you for visiting ODFE',
  receiptFooter: 'GST included where applicable · No refunds after 30 minutes',
  paymentMethods: [
    { id: 'CASH', label: 'Cash', enabled: true },
    { id: 'CARD', label: 'Card', enabled: true },
    { id: 'UPI', label: 'UPI', enabled: true },
    { id: 'WALLET', label: 'Wallet', enabled: false },
  ],
  lowStockAlerts: true,
  expiryAlerts: true,
  soundAlerts: true,
  autoPrintReceipt: false,
};

export const reservations: Reservation[] = [
  { id: 'r_1', customerName: 'Priya Menon', phone: '9448822001', partySize: 4, tableId: 't_7', time: new Date(Date.now() + 2 * 3600e3).toISOString(), status: 'UPCOMING', notes: 'Birthday — bring a candle' },
  { id: 'r_2', customerName: 'Rahul Mehta', phone: '9820011223', partySize: 2, tableId: 't_2', time: new Date(Date.now() + 4 * 3600e3).toISOString(), status: 'UPCOMING' },
  { id: 'r_3', customerName: 'Ananya Rao', phone: '9845012345', partySize: 6, tableId: 't_11', time: new Date(Date.now() + 26 * 3600e3).toISOString(), status: 'UPCOMING', notes: 'Window seating please' },
];

// ---- Deterministic historical orders so dashboard/reports have believable data ----

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const orderTypes: OrderType[] = ['DINE_IN', 'DINE_IN', 'DINE_IN', 'TAKEAWAY', 'TAKEAWAY', 'DELIVERY'];
const payMethods: PaymentMethod[] = ['CASH', 'CARD', 'UPI', 'UPI', 'CARD', 'CASH'];

export function generateHistoricalOrders(): Order[] {
  const rand = mulberry32(20260413);
  const orders: Order[] = [];
  const sellable = products.filter((p) => p.available);
  let counter = 700;

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const isToday = dayOffset === 0;
    const ordersToday = isToday ? 14 : 16 + Math.floor(rand() * 12);
    for (let i = 0; i < ordersToday; i++) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      // Peak hours 8-11 and 16-19
      const hourPool = [8, 9, 9, 10, 10, 11, 12, 13, 13, 15, 16, 17, 17, 18, 19, 20];
      date.setHours(hourPool[Math.floor(rand() * hourPool.length)], Math.floor(rand() * 60), Math.floor(rand() * 60), 0);

      const lineCount = 1 + Math.floor(rand() * 4);
      const chosen: Product[] = [];
      for (let l = 0; l < lineCount; l++) chosen.push(sellable[Math.floor(rand() * sellable.length)]);
      const lines = chosen.map((product) => {
        const qty = 1 + Math.floor(rand() * 2);
        const sizeId = product.sizes.length && rand() > 0.5 ? product.sizes[product.sizes.length - 1].id : product.sizes[0]?.id;
        const addons = product.addons.length && rand() > 0.7 ? [product.addons[Math.floor(rand() * product.addons.length)]] : [];
        return makeLine({ product, quantity: qty, sizeId, addons, lineId: uid('l') });
      });
      const useDiscount = rand() > 0.82;
      const discount = useDiscount ? { type: 'PERCENT' as const, value: 10, code: 'WELCOME10' } : undefined;
      const totals = computeTotals({ lines, discount, taxRate: defaultSettings.taxRate, serviceChargeEnabled: defaultSettings.serviceChargeEnabled, serviceChargeRate: defaultSettings.serviceChargeRate });
      const type = orderTypes[Math.floor(rand() * orderTypes.length)];
      const method = payMethods[Math.floor(rand() * payMethods.length)];

      let prepStatus: PrepStatus = 'COMPLETED';
      let paymentStatus: Order['paymentStatus'] = 'PAID';
      if (isToday) {
        const roll = rand();
        if (roll > 0.78) { prepStatus = 'NEW'; paymentStatus = rand() > 0.4 ? 'PAID' : 'UNPAID'; }
        else if (roll > 0.6) { prepStatus = 'PREPARING'; paymentStatus = 'PAID'; }
        else if (roll > 0.48) { prepStatus = 'READY'; paymentStatus = 'PAID'; }
      }

      const customer = rand() > 0.55 ? customers[Math.floor(rand() * customers.length)] : undefined;
      orders.push({
        id: `o_seed_${counter}`,
        number: `OD${counter}`,
        type,
        tableId: type === 'DINE_IN' ? `t_${1 + Math.floor(rand() * 12)}` : undefined,
        tableLabel: type === 'DINE_IN' ? `Table ${1 + Math.floor(rand() * 12)}` : undefined,
        customerId: customer?.id,
        customerName: customer?.name,
        customerPhone: customer?.phone,
        lines,
        totals,
        paymentStatus,
        paymentMethod: paymentStatus === 'PAID' ? method : undefined,
        prepStatus,
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
        cashierName: rand() > 0.5 ? 'Jamie Lee' : 'Fatima Khan',
        cashierId: 'u_cashier',
        branchId: 'br_main',
        discountCode: discount?.code,
      });
      counter++;
    }
  }
  return orders;
}

export function generateStockMovements(): StockMovement[] {
  const rand = mulberry32(99);
  const movements: StockMovement[] = [];
  for (let i = 0; i < 40; i++) {
    const ing = ingredients[Math.floor(rand() * ingredients.length)];
    const type = rand() > 0.6 ? 'IN' : rand() > 0.25 ? 'OUT' : 'WASTE';
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(rand() * 10));
    date.setHours(8 + Math.floor(rand() * 10), Math.floor(rand() * 60), 0, 0);
    movements.push({
      id: uid('mv'),
      ingredientId: ing.id,
      ingredientName: ing.name,
      type,
      quantity: roundMoney(type === 'IN' ? 2 + rand() * 12 : 0.5 + rand() * 4),
      reason: type === 'IN' ? 'Supplier delivery' : type === 'OUT' ? 'Kitchen usage' : 'Expired / spoiled',
      at: date.toISOString(),
      by: 'Neha Gupta',
    });
  }
  return movements.sort((a, b) => +new Date(b.at) - +new Date(a.at));
}

export function seedTablesWithOrders(allOrders: Order[]): CafeTable[] {
  const active = allOrders.filter((o) => o.prepStatus !== 'COMPLETED' && o.prepStatus !== 'CANCELLED' && o.type === 'DINE_IN' && o.tableId);
  return tables.map((t) => {
    const order = active.find((o) => o.tableId === t.id);
    if (order) return { ...t, status: 'OCCUPIED', orderId: order.id, occupiedSince: order.createdAt };
    return t;
  });
}
