import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CartLine, Order, PaymentStatus, PrepStatus } from '../types';
import { getReport, type ReportRange } from './api';
import { useDb } from './db';

function line(id: string, unitPrice: number): CartLine {
  return {
    lineId: `l-${id}`,
    productId: 'p-test',
    name: 'Test item',
    image: 'test.jpg',
    basePrice: unitPrice,
    addons: [],
    quantity: 1,
    unitPrice,
    sendToKitchen: false,
  };
}

function order(input: {
  id: string;
  createdAt: string;
  total: number;
  discount?: number;
  paymentStatus?: PaymentStatus;
  prepStatus?: PrepStatus;
}): Order {
  const discount = input.discount ?? 0;
  return {
    id: input.id,
    number: input.id,
    type: 'TAKEAWAY',
    lines: [line(input.id, input.total)],
    totals: {
      subtotal: input.total + discount,
      discount,
      tax: 0,
      serviceCharge: 0,
      total: input.total,
    },
    paymentStatus: input.paymentStatus ?? 'PAID',
    prepStatus: input.prepStatus ?? 'COMPLETED',
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    cashierId: 'u-test',
    cashierName: 'Test cashier',
    branchId: 'b-test',
  };
}

async function report(range: ReportRange) {
  const promise = getReport(range);
  await vi.advanceTimersByTimeAsync(400);
  return promise;
}

describe('getReport range summaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00'));
    useDb.getState().reset();
    useDb.getState().mutate(() => ({
      orders: [
        order({ id: 'today-paid', createdAt: '2026-06-15T10:00:00', total: 100, discount: 10 }),
        order({ id: 'week-paid', createdAt: '2026-06-10T10:00:00', total: 200, discount: 20 }),
        order({ id: 'month-paid', createdAt: '2026-06-02T10:00:00', total: 300, discount: 30 }),
        order({ id: 'year-paid', createdAt: '2026-02-01T10:00:00', total: 400, discount: 40 }),
        order({ id: 'last-year-paid', createdAt: '2025-12-31T10:00:00', total: 500, discount: 50 }),
        order({ id: 'month-refunded', createdAt: '2026-06-05T10:00:00', total: 50, discount: 5, paymentStatus: 'REFUNDED' }),
        order({ id: 'today-unpaid', createdAt: '2026-06-15T11:00:00', total: 60, discount: 6, paymentStatus: 'UNPAID', prepStatus: 'NEW' }),
        order({ id: 'month-pending', createdAt: '2026-06-02T12:00:00', total: 70, paymentStatus: 'UNPAID', prepStatus: 'PREPARING' }),
      ],
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses today for the dashboard fields', async () => {
    const data = await report('today');

    expect(data.summary.todaySales).toBe(100);
    expect(data.summary.todayOrders).toBe(2);
    expect(data.summary.pendingOrders).toBe(1);
  });

  it('scopes gross sales, orders, pending orders and net revenue to the range', async () => {
    const today = await report('today');
    expect(today.summary.rangeSales).toBe(110);
    expect(today.summary.rangeOrders).toBe(2);
    expect(today.summary.rangePendingOrders).toBe(1);
    expect(today.discounts).toBe(10);
    expect(today.refunds).toBe(0);

    const week = await report('week');
    expect(week.summary.rangeSales).toBe(330);
    expect(week.summary.rangeOrders).toBe(3);
    expect(week.summary.rangePendingOrders).toBe(1);
    expect(week.summary.averageOrderValue).toBe(150);
    expect(week.discounts).toBe(30);
    expect(week.refunds).toBe(0);

    const month = await report('month');
    expect(month.summary.rangeSales).toBe(715);
    expect(month.summary.rangeOrders).toBe(6);
    expect(month.summary.rangePendingOrders).toBe(2);
    expect(month.summary.averageOrderValue).toBe(200);
    expect(month.discounts).toBe(65);
    expect(month.refunds).toBe(50);

    const year = await report('year');
    expect(year.summary.rangeSales).toBe(1155);
    expect(year.summary.rangeOrders).toBe(7);
    expect(year.summary.rangePendingOrders).toBe(2);
    expect(year.summary.averageOrderValue).toBe(250);
    expect(year.discounts).toBe(105);
    expect(year.refunds).toBe(50);
  });

  it('builds a trend window that matches the selected range', async () => {
    expect((await report('today')).salesOverTime).toHaveLength(16);
    expect((await report('week')).salesOverTime).toHaveLength(7);
    expect((await report('month')).salesOverTime).toHaveLength(15);
    expect((await report('year')).salesOverTime).toHaveLength(6);
  });

  it('counts orders by hour across the selected range', async () => {
    const month = await report('month');
    const atTen = month.ordersByHour.find((point) => point.label === '10:00');
    const atTwelve = month.ordersByHour.find((point) => point.label === '12:00');

    expect(atTen?.value).toBe(4);
    expect(atTwelve?.value).toBe(1);
  });
});
