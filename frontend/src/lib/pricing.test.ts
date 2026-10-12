import { describe, it, expect, beforeEach } from 'vitest';
import type { Addon, CartLine, Product } from '../types';
import {
  cashChange,
  canTransitionPayment,
  computeTotals,
  discountAmountFor,
  makeLine,
  roundMoney,
  subtotalOf,
  unitPriceFor,
} from './pricing';
import { canTransitionPrep } from '../services/api';
import { configureMoney, money } from './format';

const baseProduct: Product = {
  id: 'p-latte',
  name: 'Caffè Latte',
  description: 'Double shot, steamed milk',
  categoryId: 'c-coffee',
  price: 220,
  image: 'latte.jpg',
  available: true,
  sendToKitchen: false,
  prepMinutes: 3,
  sizes: [
    { id: 's-reg', name: 'Regular', priceDelta: 0 },
    { id: 's-large', name: 'Large', priceDelta: 40 },
  ],
  addons: [],
};

const extraShot: Addon = { id: 'a-shot', name: 'Extra shot', price: 30 };
const oatMilk: Addon = { id: 'a-oat', name: 'Oat milk', price: 25 };

function line(unitPrice: number, quantity: number, id = `l-${unitPrice}-${quantity}`): CartLine {
  return {
    lineId: id,
    productId: `p-${id}`,
    name: 'Test item',
    image: 'x.jpg',
    basePrice: unitPrice,
    addons: [],
    quantity,
    unitPrice,
    sendToKitchen: false,
  };
}

describe('roundMoney', () => {
  it('rounds to two decimals', () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(2.674)).toBe(2.67);
    expect(roundMoney(0)).toBe(0);
  });

  it('avoids binary floating point drift', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(2.5 * 3)).toBe(7.5);
  });
});

describe('money formatting', () => {
  beforeEach(() => configureMoney('INR', 'en-IN'));

  it('formats INR with the rupee symbol and two decimals', () => {
    const formatted = money(1234.5);
    expect(formatted).toContain('₹');
    expect(formatted).toContain('1,234.50');
  });

  it('treats non-finite input as zero', () => {
    expect(money(Number.NaN)).toContain('0.00');
  });

  it('switches currency when reconfigured', () => {
    configureMoney('USD', 'en-US');
    expect(money(99)).toContain('$');
    configureMoney('INR', 'en-IN');
  });
});

describe('pricing a single line', () => {
  it('adds size deltas and addons to the unit price', () => {
    expect(unitPriceFor(baseProduct, 's-large', [extraShot, oatMilk])).toBe(220 + 40 + 30 + 25);
  });

  it('ignores an unknown size', () => {
    expect(unitPriceFor(baseProduct, 's-missing')).toBe(220);
  });

  it('builds a line with a folded unit price and clamps quantity to at least 1', () => {
    const built = makeLine({ product: baseProduct, quantity: 0, sizeId: 's-large', addons: [extraShot], lineId: 'l1' });
    expect(built.quantity).toBe(1);
    expect(built.unitPrice).toBe(290);
    expect(built.sizeName).toBe('Large');
    expect(built.productId).toBe('p-latte');
  });

  it('trims whitespace-only notes to undefined', () => {
    const built = makeLine({ product: baseProduct, quantity: 1, notes: '   ', lineId: 'l2' });
    expect(built.notes).toBeUndefined();
  });

  it('subtotals across lines', () => {
    expect(subtotalOf([line(100, 2), line(50, 3)])).toBe(350);
  });
});

describe('discountAmountFor', () => {
  it('computes a percentage discount', () => {
    expect(discountAmountFor({ type: 'PERCENT', value: 10 }, 250)).toBe(25);
  });

  it('computes a flat discount', () => {
    expect(discountAmountFor({ type: 'FLAT', value: 40 }, 250)).toBe(40);
  });

  it('clamps a discount to the subtotal', () => {
    expect(discountAmountFor({ type: 'FLAT', value: 500 }, 250)).toBe(250);
    expect(discountAmountFor({ type: 'PERCENT', value: 150 }, 250)).toBe(250);
  });

  it('never returns a negative discount', () => {
    expect(discountAmountFor({ type: 'FLAT', value: -20 }, 250)).toBe(0);
  });

  it('returns 0 without a discount or with an empty basket', () => {
    expect(discountAmountFor(undefined, 250)).toBe(0);
    expect(discountAmountFor({ type: 'PERCENT', value: 10 }, 0)).toBe(0);
  });
});

describe('computeTotals', () => {
  it('applies discount, tax and service charge in the documented order', () => {
    const totals = computeTotals({
      lines: [line(100, 2)],
      discount: { type: 'PERCENT', value: 10 },
      taxRate: 0.05,
      serviceChargeEnabled: true,
      serviceChargeRate: 0.05,
    });
    expect(totals).toEqual({ subtotal: 200, discount: 20, tax: 9, serviceCharge: 9, total: 198 });
  });

  it('omits the service charge when disabled', () => {
    const totals = computeTotals({
      lines: [line(100, 2)],
      taxRate: 0.05,
      serviceChargeEnabled: false,
      serviceChargeRate: 0.05,
    });
    expect(totals.serviceCharge).toBe(0);
    expect(totals.total).toBe(210);
  });

  it('taxes the discounted net, not the gross subtotal', () => {
    const totals = computeTotals({
      lines: [line(100, 1)],
      discount: { type: 'FLAT', value: 50 },
      taxRate: 0.1,
      serviceChargeEnabled: false,
      serviceChargeRate: 0,
    });
    expect(totals.subtotal).toBe(100);
    expect(totals.tax).toBe(5);
    expect(totals.total).toBe(55);
  });

  it('handles an empty basket', () => {
    const totals = computeTotals({ lines: [], taxRate: 0.05, serviceChargeEnabled: true, serviceChargeRate: 0.05 });
    expect(totals).toEqual({ subtotal: 0, discount: 0, tax: 0, serviceCharge: 0, total: 0 });
  });
});

describe('cashChange', () => {
  it('returns the change due when over-tendered', () => {
    expect(cashChange(500, 450)).toBe(50);
  });

  it('returns a negative value when under-tendered', () => {
    expect(cashChange(400, 450)).toBe(-50);
  });

  it('treats invalid tender as zero', () => {
    expect(cashChange(Number.NaN, 100)).toBe(-100);
  });
});

describe('payment state machine', () => {
  it('allows only legal payment transitions', () => {
    expect(canTransitionPayment('UNPAID', 'PAID')).toBe(true);
    expect(canTransitionPayment('PAID', 'REFUNDED')).toBe(true);
  });

  it('rejects illegal payment transitions', () => {
    expect(canTransitionPayment('UNPAID', 'REFUNDED')).toBe(false);
    expect(canTransitionPayment('PAID', 'UNPAID')).toBe(false);
    expect(canTransitionPayment('REFUNDED', 'PAID')).toBe(false);
  });
});

describe('prep state machine', () => {
  it('allows forward kitchen flow', () => {
    expect(canTransitionPrep('NEW', 'PREPARING')).toBe(true);
    expect(canTransitionPrep('PREPARING', 'READY')).toBe(true);
    expect(canTransitionPrep('READY', 'COMPLETED')).toBe(true);
  });

  it('allows skipping ahead from NEW and cancelling before completion', () => {
    expect(canTransitionPrep('NEW', 'COMPLETED')).toBe(true);
    expect(canTransitionPrep('NEW', 'CANCELLED')).toBe(true);
  });

  it('rejects backwards and post-completion transitions', () => {
    expect(canTransitionPrep('COMPLETED', 'PREPARING')).toBe(false);
    expect(canTransitionPrep('CANCELLED', 'NEW')).toBe(false);
    expect(canTransitionPrep('READY', 'NEW')).toBe(false);
  });
});
