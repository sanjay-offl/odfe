// Single source of truth for money math. Business rules live here, never in components.
import type { Addon, CartLine, Coupon, OrderTotals, Product } from '../types';

/** Rounds to 2 decimals avoiding binary floating point drift. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface LineConfig {
  product: Product;
  quantity: number;
  sizeId?: string;
  addons?: Addon[];
  notes?: string;
  lineId: string;
}

export function unitPriceFor(product: Product, sizeId?: string, addons: Addon[] = []): number {
  const size = product.sizes.find((s) => s.id === sizeId);
  const sizeDelta = size ? size.priceDelta : 0;
  const addonTotal = addons.reduce((sum, a) => sum + a.price, 0);
  return roundMoney(product.price + sizeDelta + addonTotal);
}

/** Builds a fully-priced cart line from a product + customization choices. */
export function makeLine({ product, quantity, sizeId, addons = [], notes, lineId }: LineConfig): CartLine {
  const size = product.sizes.find((s) => s.id === sizeId);
  return {
    lineId,
    productId: product.id,
    name: product.name,
    image: product.image,
    basePrice: product.price,
    sizeId: size?.id,
    sizeName: size?.name,
    sizePrice: size?.priceDelta,
    addons,
    notes: notes?.trim() || undefined,
    quantity: Math.max(1, quantity),
    unitPrice: unitPriceFor(product, sizeId, addons),
    sendToKitchen: product.sendToKitchen,
    dietary: product.dietary,
  };
}

export function lineTotal(line: CartLine): number {
  return roundMoney(line.unitPrice * line.quantity);
}

export function subtotalOf(lines: CartLine[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export type Discount = { type: 'PERCENT' | 'FLAT'; value: number; code?: string };

export function discountAmountFor(discount: Discount | undefined, subtotal: number): number {
  if (!discount || subtotal <= 0) return 0;
  const raw = discount.type === 'PERCENT' ? (subtotal * discount.value) / 100 : discount.value;
  return roundMoney(Math.min(Math.max(raw, 0), subtotal));
}

export function couponToDiscount(coupon: Coupon, subtotal: number): Discount | undefined {
  if (!coupon.active || subtotal < coupon.minSubtotal) return undefined;
  return { type: coupon.type, value: coupon.value, code: coupon.code };
}

export interface TotalsInput {
  lines: CartLine[];
  discount?: Discount;
  taxRate: number; // e.g. 0.05 for 5%
  serviceChargeEnabled: boolean;
  serviceChargeRate: number;
}

/**
 * Computes order totals.
 *  subtotal      = Σ line unit price × qty
 *  discount      = applied to subtotal (clamped to subtotal)
 *  net           = subtotal − discount
 *  tax           = net × taxRate
 *  serviceCharge = net × serviceChargeRate (when enabled)
 *  total         = net + tax + serviceCharge
 * All values rounded to 2 decimals independently for display consistency.
 */
export function computeTotals(input: TotalsInput): OrderTotals {
  const subtotal = subtotalOf(input.lines);
  const discount = discountAmountFor(input.discount, subtotal);
  const net = roundMoney(subtotal - discount);
  const tax = roundMoney(net * input.taxRate);
  const serviceCharge = input.serviceChargeEnabled ? roundMoney(net * input.serviceChargeRate) : 0;
  const total = roundMoney(net + tax + serviceCharge);
  return { subtotal, discount, tax, serviceCharge, total };
}

/** Change due for cash payments. Returns a negative number when under-tendered. */
export function cashChange(tendered: number, total: number): number {
  return roundMoney((Number.isFinite(tendered) ? tendered : 0) - total);
}

/** Validates that payment status transitions are legal. */
export function canTransitionPayment(from: string, to: string): boolean {
  const allowed: Record<string, string[]> = {
    UNPAID: ['PAID'],
    PAID: ['REFUNDED'],
    REFUNDED: [],
  };
  return (allowed[from] ?? []).includes(to);
}
