export const categories = [
  { id: 1, name: "Quick Bites", color: "#F97316" },
  { id: 2, name: "Burger", color: "#22C55E" },
  { id: 3, name: "Pizza", color: "#3B82F6" },
  { id: 4, name: "Dessert", color: "#A855F7" },
  { id: 5, name: "Drink", color: "#EAB308" }
];

export const products = [
  { id: 1, name: "Masala Tea", category: "Drink", price: 40, tax: 5, uom: "Cup" },
  { id: 2, name: "Coffee", category: "Drink", price: 50, tax: 5, uom: "Cup" },
  { id: 3, name: "Lassi", category: "Drink", price: 70, tax: 5, uom: "Glass" },
  { id: 4, name: "Veg Burger", category: "Burger", price: 150, tax: 5, uom: "Piece" },
  { id: 5, name: "Chicken Burger", category: "Burger", price: 220, tax: 5, uom: "Piece" },
  { id: 6, name: "Margherita Pizza", category: "Pizza", price: 280, tax: 5, uom: "Piece" },
  { id: 7, name: "Farmhouse Pizza", category: "Pizza", price: 360, tax: 5, uom: "Piece" },
  { id: 8, name: "Brownie", category: "Dessert", price: 120, tax: 5, uom: "Piece" },
  { id: 9, name: "French Fries", category: "Quick Bites", price: 110, tax: 5, uom: "Plate" },
  { id: 10, name: "Sandwich", category: "Quick Bites", price: 140, tax: 5, uom: "Piece" },
  { id: 11, name: "Cold Coffee", category: "Drink", price: 90, tax: 5, uom: "Glass" },
  { id: 12, name: "Ice Cream", category: "Dessert", price: 95, tax: 5, uom: "Cup" }
];

export const floors = [
  { id: 1, name: "Ground Floor" },
  { id: 2, name: "First Floor" }
];

export const tables = [
  { id: 1, floor: 1, table: "T1", seats: 2, status: "Occupied" },
  { id: 2, floor: 1, table: "T2", seats: 4, status: "Available" },
  { id: 3, floor: 1, table: "T3", seats: 6, status: "Occupied" },
  { id: 4, floor: 1, table: "T4", seats: 2, status: "Available" },
  { id: 5, floor: 1, table: "T5", seats: 4, status: "Reserved" },
  { id: 6, floor: 1, table: "T6", seats: 2, status: "Available" },
  { id: 7, floor: 2, table: "T7", seats: 4, status: "Available" },
  { id: 8, floor: 2, table: "T8", seats: 6, status: "Occupied" },
  { id: 9, floor: 2, table: "T9", seats: 2, status: "Available" },
  { id: 10, floor: 2, table: "T10", seats: 8, status: "Available" },
  { id: 11, floor: 2, table: "T11", seats: 4, status: "Reserved" },
  { id: 12, floor: 2, table: "T12", seats: 2, status: "Occupied" }
];

export const customers = [
  { id: 1, name: "Alex", email: "alex@gmail.com", phone: "9876543210" },
  { id: 2, name: "Eric", email: "eric@gmail.com", phone: "9898989898" },
  { id: 3, name: "Sara", email: "sara@gmail.com", phone: "9123456789" },
  { id: 4, name: "John", email: "john@gmail.com", phone: "9000000001" },
  { id: 5, name: "Priya", email: "priya@gmail.com", phone: "9000000002" }
];

export const employees = [
  { id: 1, name: "Admin", role: "User" },
  { id: 2, name: "Eric", role: "Employee" },
  { id: 3, name: "Sara", role: "Employee" }
];

export const paymentMethods = [
  { id: 1, name: "Cash", enabled: true },
  { id: 2, name: "Card", enabled: true },
  { id: 3, name: "UPI", enabled: true, upi: "odoocafe@ybl" }
];

export const coupons = [
  { code: "WELCOME20", type: "percentage", value: 20 },
  { code: "SAVE100", type: "fixed", value: 100 },
  { code: "NEWUSER", type: "percentage", value: 15 }
];

export const promotions = [
  { id: 1, type: "Product", product: "Veg Burger", minimumQty: 2, discount: "20%" },
  { id: 2, type: "Order", minimumAmount: 1000, discount: "10%" }
];

export const currentDraftCart = [
  { product: "Veg Burger", qty: 2, price: 150, promotion: "20%" },
  { product: "Masala Tea", qty: 3, price: 40 },
  { product: "Brownie", qty: 1, price: 120 }
];

export const orders = [
  { id: "00001", customer: "Alex", status: "Draft", amount: 540 },
  { id: "00002", customer: "Eric", status: "Paid", amount: 720 },
  { id: "00003", customer: "Sara", status: "Cancelled", amount: 350 },
  { id: "00004", customer: "John", status: "Paid", amount: 1020 }
];

export const kitchenOrders = [
  { ticket: "2201", status: "To Cook", items: ["2x Veg Burger", "3x Tea"] },
  { ticket: "2202", status: "Preparing", items: ["Pizza", "Coffee"] },
  { ticket: "2203", status: "Completed", items: ["Burger", "Brownie"] }
];

export const selfOrderingToken = {
  table: "T8",
  url: "https://odoocafe.com/s/asdfgh123456",
  token: "asdfgh123456"
};

export const posSession = {
  lastOpen: "20 Jun 2026 09:00 AM",
  lastCloseSale: 48250,
  currentSession: "Morning Shift"
};

export const dashboardStatistics = {
  orders: 245,
  revenue: 85420,
  averageOrder: 348,
  customers: 178,
  discount: 5420,
  taxCollected: 4070
};

export const salesTrend = [
  { day: "Mon", sales: 8500 },
  { day: "Tue", sales: 9100 },
  { day: "Wed", sales: 7800 },
  { day: "Thu", sales: 11200 },
  { day: "Fri", sales: 15400 },
  { day: "Sat", sales: 20100 },
  { day: "Sun", sales: 13320 }
];

export const topCategories = [
  { name: "Burger", revenue: 30200 },
  { name: "Pizza", revenue: 22000 },
  { name: "Drink", revenue: 14800 },
  { name: "Dessert", revenue: 9800 },
  { name: "Quick Bites", revenue: 8620 }
];

export const topProducts = [
  { name: "Veg Burger", qty: 250, revenue: 37500 },
  { name: "Coffee", qty: 410, revenue: 20500 },
  { name: "Margherita Pizza", qty: 110, revenue: 30800 },
  { name: "Tea", qty: 600, revenue: 24000 }
];

// Calculation utility functions based on provided logic
export const calculateLineTotal = (price: number, qty: number) => {
  return price * qty;
};

export const calculateProductPromotion = (lineTotal: number, discountPercentage: number) => {
  return (lineTotal * discountPercentage) / 100;
};

export const calculateCouponDiscount = (subtotal: number, coupon: { type: string; value: number }) => {
  if (!coupon) return 0;
  if (coupon.type === "percentage") {
    return (subtotal * coupon.value) / 100;
  } else if (coupon.type === "fixed") {
    return coupon.value;
  }
  return 0;
};

export const calculateTax = (subtotal: number, taxRate: number = 5) => {
  return (subtotal * taxRate) / 100;
};

export const calculateGrandTotal = (
  subtotal: number,
  productDiscounts: number,
  couponDiscount: number,
  tax: number
) => {
  return subtotal - productDiscounts - couponDiscount + tax;
};

export const calculateChange = (bill: number, cashGiven: number) => {
  return cashGiven - bill;
};
