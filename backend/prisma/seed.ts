import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import ws from 'ws';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || '',
  { auth: { persistSession: false }, realtime: { transport: ws as any } }
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { autoRefreshToken: false, persistSession: false }, realtime: { transport: ws as any } }
);

async function upsertSupabaseUser(email: string, password: string, name: string, fallbackId: string): Promise<string> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to create auth users via Admin API.');
  }
  
  // Try to find the user first
  let userId = '';
  try {
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (!listError) {
      const existingUser = users.find(u => u.email === email);
      if (existingUser) userId = existingUser.id;
    }
  } catch (_) {}

  if (userId) {
    // Update existing user's password and metadata to ensure they can login
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { full_name: name },
      email_confirm: true
    });
    if (updateError) console.error(`Error updating user ${email}:`, updateError.message);
  } else {
    // Create new user
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name }
    });
    if (createError) {
      throw new Error(`Error creating user ${email}: ${createError.message}`);
    }
    if (createData?.user?.id) userId = createData.user.id;
  }
  
  return userId || fallbackId;
}

async function main() {
  console.log('🌱 Starting ODFE seed...');

  // ── 1. ADMIN ──────────────────────────────────────────────────────────────
  const adminId = await upsertSupabaseUser('admin@odfe.local', 'Admin@123', 'ODFE Admin', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@odfe.local' },
    update: { name: 'ODFE Admin', role: 'ADMIN', plan: 'PRO', isActive: true },
    create: { id: adminId, email: 'admin@odfe.local', name: 'ODFE Admin', role: 'ADMIN', plan: 'PRO', isActive: true },
  });
  await prisma.businessSetting.upsert({
    where: { adminId: admin.id },
    update: {},
    create: {
      adminId: admin.id, cafeName: 'ODFE Cafe', currency: '₹ INR', timezone: 'Asia/Kolkata',
      taxRate: 5.0, language: 'English', receiptFooter: 'Thank you for visiting ODFE Cafe!',
      gstNumber: '33ABCDE1234F1Z5', phone: '+91 9876543210', address: 'Coimbatore, Tamil Nadu',
    },
  });
  console.log('✅ Admin created:', admin.email);

  // ── 2. EMPLOYEES ──────────────────────────────────────────────────────────
  const empData = [
    { name: 'Arun Kumar',  email: 'cashier1@odfe.local', pass: 'Cashier@123', no: 'EMP001', position: 'Cashier',  shift: 'Morning',  fid: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01' },
    { name: 'Priya',       email: 'cashier2@odfe.local', pass: 'Cashier@123', no: 'EMP002', position: 'Orders',   shift: 'Evening',  fid: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02' },
    { name: 'Rahul',       email: 'kitchen@odfe.local',  pass: 'Kitchen@123', no: 'EMP003', position: 'Kitchen',  shift: 'Morning',  fid: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03' },
    { name: 'Sneha',       email: 'billing@odfe.local',  pass: 'Billing@123', no: 'EMP004', position: 'Billing',  shift: 'Evening',  fid: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04' },
    { name: 'Karthik',     email: 'cashier3@odfe.local', pass: 'Cashier@123', no: 'EMP005', position: 'Cashier',  shift: 'Weekend',  fid: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb05' },
  ];

  const employeeRecords: any[] = [];
  for (const emp of empData) {
    const uid = await upsertSupabaseUser(emp.email, emp.pass, emp.name, emp.fid);
    const u = await prisma.user.upsert({
      where: { email: emp.email },
      update: { name: emp.name, role: 'EMPLOYEE' },
      create: { id: uid, email: emp.email, name: emp.name, role: 'EMPLOYEE', plan: 'FREE' },
    });
    const e = await prisma.employee.upsert({
      where: { email: emp.email },
      update: { position: emp.position, shift: emp.shift },
      create: {
        userId: u.id, adminId: admin.id, name: emp.name, email: emp.email,
        employeeNo: emp.no, position: emp.position, shift: emp.shift,
        hourlyRate: 180.0, hireDate: new Date('2024-01-01'), status: 'Active',
      },
    });
    employeeRecords.push(e);
    console.log(`✅ Employee: ${emp.email} (${emp.position})`);
  }

  // ── 3. PAYMENT METHODS ────────────────────────────────────────────────────
  for (const pm of [
    { name: 'Cash', upiId: null },
    { name: 'Card', upiId: null },
    { name: 'UPI',  upiId: 'odfe@ybl' },
    { name: 'Wallet', upiId: null },
  ]) {
    await prisma.paymentMethod.upsert({
      where: { adminId_name: { adminId: admin.id, name: pm.name } },
      update: {},
      create: { adminId: admin.id, name: pm.name, upiId: pm.upiId, isActive: true },
    });
  }

  // ── 4. CATEGORIES ─────────────────────────────────────────────────────────
  const catDefs = [
    { name: 'Coffee',      color: '#6F4E37', icon: '☕' },
    { name: 'Tea',         color: '#8BC34A', icon: '🍵' },
    { name: 'Pizza',       color: '#FF5722', icon: '🍕' },
    { name: 'Burger',      color: '#FF9800', icon: '🍔' },
    { name: 'Dessert',     color: '#E91E63', icon: '🍰' },
    { name: 'Quick Bites', color: '#F44336', icon: '🍟' },
    { name: 'Cold Drinks', color: '#03A9F4', icon: '🥤' },
  ];
  const catMap: Record<string, string> = {};
  for (const cat of catDefs) {
    const existing = await prisma.category.findFirst({ where: { adminId: admin.id, name: cat.name } });
    const c = existing
      ? await prisma.category.update({ where: { id: existing.id }, data: { color: cat.color } })
      : await prisma.category.create({ data: { adminId: admin.id, name: cat.name, color: cat.color } });
    catMap[cat.name] = c.id;
  }
  console.log('✅ Categories created');

  // ── 5. PRODUCTS ───────────────────────────────────────────────────────────
  const prodDefs = [
    // Coffee (10)
    { name: 'Espresso',        cat: 'Coffee',      price: 120, cost: 40,  img: '☕', sku: 'SKU-C01' },
    { name: 'Americano',       cat: 'Coffee',      price: 150, cost: 50,  img: '☕', sku: 'SKU-C02' },
    { name: 'Latte',           cat: 'Coffee',      price: 180, cost: 70,  img: '☕', sku: 'SKU-C03' },
    { name: 'Cappuccino',      cat: 'Coffee',      price: 180, cost: 70,  img: '☕', sku: 'SKU-C04' },
    { name: 'Mocha',           cat: 'Coffee',      price: 200, cost: 80,  img: '☕', sku: 'SKU-C05' },
    { name: 'Flat White',      cat: 'Coffee',      price: 190, cost: 75,  img: '☕', sku: 'SKU-C06' },
    { name: 'Cold Brew',       cat: 'Coffee',      price: 220, cost: 90,  img: '☕', sku: 'SKU-C07' },
    { name: 'Affogato',        cat: 'Coffee',      price: 250, cost: 100, img: '☕', sku: 'SKU-C08' },
    { name: 'Macchiato',       cat: 'Coffee',      price: 160, cost: 60,  img: '☕', sku: 'SKU-C09' },
    { name: 'Irish Coffee',    cat: 'Coffee',      price: 280, cost: 110, img: '☕', sku: 'SKU-C10' },
    // Tea (5)
    { name: 'Masala Tea',      cat: 'Tea',         price: 60,  cost: 20,  img: '🍵', sku: 'SKU-T01' },
    { name: 'Green Tea',       cat: 'Tea',         price: 90,  cost: 25,  img: '🍵', sku: 'SKU-T02' },
    { name: 'Ginger Tea',      cat: 'Tea',         price: 70,  cost: 22,  img: '🍵', sku: 'SKU-T03' },
    { name: 'Lemon Tea',       cat: 'Tea',         price: 80,  cost: 25,  img: '🍵', sku: 'SKU-T04' },
    { name: 'Cardamom Tea',    cat: 'Tea',         price: 80,  cost: 25,  img: '🍵', sku: 'SKU-T05' },
    // Pizza (5)
    { name: 'Margherita Pizza',cat: 'Pizza',       price: 280, cost: 110, img: '🍕', sku: 'SKU-P01' },
    { name: 'Farmhouse Pizza', cat: 'Pizza',       price: 360, cost: 150, img: '🍕', sku: 'SKU-P02' },
    { name: 'Pepperoni Pizza', cat: 'Pizza',       price: 380, cost: 160, img: '🍕', sku: 'SKU-P03' },
    { name: 'BBQ Chicken Pizza',cat: 'Pizza',      price: 400, cost: 170, img: '🍕', sku: 'SKU-P04' },
    { name: 'Veggie Supreme',  cat: 'Pizza',       price: 320, cost: 130, img: '🍕', sku: 'SKU-P05' },
    // Burger (5)
    { name: 'Veg Burger',      cat: 'Burger',      price: 150, cost: 55,  img: '🍔', sku: 'SKU-B01' },
    { name: 'Chicken Burger',  cat: 'Burger',      price: 220, cost: 90,  img: '🍔', sku: 'SKU-B02' },
    { name: 'Double Patty',    cat: 'Burger',      price: 280, cost: 120, img: '🍔', sku: 'SKU-B03' },
    { name: 'Paneer Burger',   cat: 'Burger',      price: 190, cost: 75,  img: '🍔', sku: 'SKU-B04' },
    { name: 'Mushroom Burger', cat: 'Burger',      price: 200, cost: 80,  img: '🍔', sku: 'SKU-B05' },
    // Dessert (5)
    { name: 'Brownie',         cat: 'Dessert',     price: 120, cost: 50,  img: '🍰', sku: 'SKU-D01' },
    { name: 'Chocolate Cake',  cat: 'Dessert',     price: 200, cost: 80,  img: '🍰', sku: 'SKU-D02' },
    { name: 'Cheesecake',      cat: 'Dessert',     price: 250, cost: 100, img: '🍰', sku: 'SKU-D03' },
    { name: 'Ice Cream',       cat: 'Dessert',     price: 95,  cost: 35,  img: '🍦', sku: 'SKU-D04' },
    { name: 'Belgian Waffle',  cat: 'Dessert',     price: 240, cost: 95,  img: '🧇', sku: 'SKU-D05' },
    // Quick Bites (5)
    { name: 'French Fries',    cat: 'Quick Bites', price: 110, cost: 35,  img: '🍟', sku: 'SKU-Q01' },
    { name: 'Garlic Bread',    cat: 'Quick Bites', price: 130, cost: 45,  img: '🥖', sku: 'SKU-Q02' },
    { name: 'Sandwich',        cat: 'Quick Bites', price: 140, cost: 50,  img: '🥪', sku: 'SKU-Q03' },
    { name: 'Croissant',       cat: 'Quick Bites', price: 120, cost: 45,  img: '🥐', sku: 'SKU-Q04' },
    { name: 'Nachos',          cat: 'Quick Bites', price: 160, cost: 60,  img: '🌮', sku: 'SKU-Q05' },
    // Cold Drinks (5)
    { name: 'Cold Coffee',     cat: 'Cold Drinks', price: 160, cost: 60,  img: '🥤', sku: 'SKU-CD1' },
    { name: 'Mango Smoothie',  cat: 'Cold Drinks', price: 180, cost: 70,  img: '🥭', sku: 'SKU-CD2' },
    { name: 'Lemonade',        cat: 'Cold Drinks', price: 100, cost: 30,  img: '🍋', sku: 'SKU-CD3' },
    { name: 'Iced Tea',        cat: 'Cold Drinks', price: 120, cost: 40,  img: '🧊', sku: 'SKU-CD4' },
    { name: 'Orange Juice',    cat: 'Cold Drinks', price: 140, cost: 55,  img: '🍊', sku: 'SKU-CD5' },
  ];

  const productIds: string[] = [];
  const productRefs: typeof prodDefs = [];
  for (let i = 0; i < prodDefs.length; i++) {
    const p = prodDefs[i];
    const existing = await prisma.product.findFirst({ where: { adminId: admin.id, name: p.name } });
    let prod;
    if (existing) {
      prod = await prisma.product.update({ where: { id: existing.id }, data: { price: p.price, costPrice: p.cost } });
    } else {
      prod = await prisma.product.create({
        data: {
          adminId: admin.id, categoryId: catMap[p.cat], name: p.name,
          price: p.price, costPrice: p.cost, taxRate: 5.0,
          sku: p.sku, barcode: `8901234${5000 + i}`, image: p.img, isActive: true,
        },
      });
    }
    productIds.push(prod.id);
    productRefs.push(p);

    const inv = await prisma.inventory.findFirst({ where: { productId: prod.id } });
    if (!inv) {
      await prisma.inventory.create({ data: { adminId: admin.id, productId: prod.id, stock: 150, minimumStock: 20 } });
    }
  }
  console.log(`✅ ${prodDefs.length} products created`);

  // ── 6. FLOORS & TABLES ────────────────────────────────────────────────────
  const floorDefs = [
    { name: 'Ground Floor', desc: 'Indoor Seating', tables: 10 },
    { name: 'First Floor',  desc: 'Balcony View',   tables: 8  },
    { name: 'Outdoor',      desc: 'Garden Area',    tables: 8  },
    { name: 'VIP Lounge',   desc: 'Private Dining', tables: 4  },
  ];

  const tableRecords: any[] = [];
  let tableNum = 1;
  for (const fd of floorDefs) {
    let floor = await prisma.floor.findFirst({ where: { adminId: admin.id, name: fd.name } });
    if (!floor) {
      floor = await prisma.floor.create({ data: { adminId: admin.id, name: fd.name, description: fd.desc } });
    }
    for (let i = 0; i < fd.tables; i++) {
      const tname = `T${tableNum}`;
      let table = await prisma.table.findFirst({ where: { adminId: admin.id, name: tname } });
      if (!table) {
        const status = tableNum % 4 === 0 ? 'OCCUPIED' : tableNum % 7 === 0 ? 'RESERVED' : 'AVAILABLE';
        const cap = tableNum % 3 === 0 ? 6 : tableNum % 5 === 0 ? 8 : 4;
        table = await prisma.table.create({ data: { adminId: admin.id, floorId: floor.id, name: tname, capacity: cap, status: status as any } });
        await prisma.qrCode.create({ data: { adminId: admin.id, tableId: table.id, token: `tbl-${tname.toLowerCase()}`, url: `http://localhost:3001/s/tbl-${tname.toLowerCase()}` } });
      }
      tableRecords.push(table);
      tableNum++;
    }
  }
  console.log(`✅ ${tableRecords.length} tables across ${floorDefs.length} floors`);

  // ── 7. CUSTOMERS ──────────────────────────────────────────────────────────
  const custNames = [
    'Aarav Patel','Vihaan Sharma','Ananya Gupta','Diya Kumar','Advik Desai',
    'Riya Joshi','Kabir Mehta','Neha Shah','Sai Iyer','Arjun Reddy',
    'Kavya Menon','Ishaan Bhat','Mira Pillai','Krishna Rao','Rohan Das',
    'Aditi Bose','Zara Ali','Omar Khan','Tanvi Nair','Raj Verma',
  ];
  const customerIds: string[] = [];
  for (let i = 0; i < 100; i++) {
    const name = custNames[i % custNames.length] + (i >= custNames.length ? ` ${Math.floor(i / custNames.length) + 1}` : '');
    const existing = await prisma.customer.findFirst({ where: { adminId: admin.id, email: `customer${i}@odfe.com` } });
    let cust;
    if (existing) {
      cust = existing;
    } else {
      cust = await prisma.customer.create({
        data: {
          adminId: admin.id, name, email: `customer${i}@odfe.com`,
          phone: `+9198${String(1000000 + i).slice(1)}`,
          loyalty: Math.floor(Math.random() * 500),
          visitCount: Math.floor(Math.random() * 30),
          totalSpent: Math.floor(Math.random() * 15000),
        },
      });
    }
    customerIds.push(cust.id);
  }
  console.log('✅ 100 customers');

  // ── 8. COUPONS ────────────────────────────────────────────────────────────
  const couponDefs = [
    { code: 'WELCOME20',   discountType: 'percentage', discountValue: 20, minOrder: 200  },
    { code: 'SAVE100',     discountType: 'fixed',      discountValue: 100, minOrder: 500  },
    { code: 'FIRSTORDER',  discountType: 'percentage', discountValue: 15, minOrder: 100  },
    { code: 'SUMMER25',    discountType: 'percentage', discountValue: 25, minOrder: 300  },
    { code: 'COFFEE50',    discountType: 'fixed',      discountValue: 50,  minOrder: 150  },
  ];
  for (const c of couponDefs) {
    const ex = await prisma.coupon.findFirst({ where: { adminId: admin.id, code: c.code } });
    if (!ex) await prisma.coupon.create({ data: { adminId: admin.id, code: c.code, discountType: c.discountType, discountValue: c.discountValue, isActive: true } });
  }

  // ── 9. PROMOTIONS ─────────────────────────────────────────────────────────
  const promoDefs = [
    'Buy 2 Coffee – 20% Off',
    'Spend ₹500 – Get ₹50 Discount',
    'Buy Burger + Fries – Combo Discount',
  ];
  for (const name of promoDefs) {
    const ex = await prisma.promotion.findFirst({ where: { adminId: admin.id, name } });
    if (!ex) {
      await prisma.promotion.create({
        data: { adminId: admin.id, name, startDate: new Date(), endDate: new Date(Date.now() + 86400000 * 30) },
      });
    }
  }
  console.log('✅ Coupons & Promotions');

  // ── 10. SESSION ───────────────────────────────────────────────────────────
  const existingSession = await prisma.session.findFirst({ where: { userId: admin.id, closedAt: null } });
  if (!existingSession) {
    await prisma.session.create({ data: { userId: admin.id, token: `demo-session-${Date.now()}`, openingCash: 5000, openedAt: new Date() } });
  }

  // ── 11. ORDERS ────────────────────────────────────────────────────────────
  const existingOrderCount = await prisma.order.count({ where: { adminId: admin.id } });
  if (existingOrderCount < 10) {
    let orderIdx = 1;
    const emp1 = employeeRecords[0];

    const createOrder = async (statusStr: string, daysAgo: number, custId: string | null, tableIdx: number) => {
      const createdAt = new Date(Date.now() - daysAgo * 86400000 - Math.random() * 43200000);
      const order = await prisma.order.create({
        data: {
          adminId: admin.id, orderNo: `ORD-${10000 + orderIdx}`,
          tableId: tableRecords[tableIdx % tableRecords.length].id,
          customerId: custId, employeeId: emp1?.id,
          status: statusStr as any, subtotal: 0, tax: 0, total: 0, createdAt,
        },
      });
      const numItems = 2 + (orderIdx % 3);
      let subtotal = 0;
      for (let j = 0; j < numItems; j++) {
        const pidx = (orderIdx + j) % productIds.length;
        const price = prodDefs[pidx].price;
        const qty = 1 + (j % 2);
        const lineTotal = price * qty;
        subtotal += lineTotal;
        await prisma.orderItem.create({
          data: { orderId: order.id, productId: productIds[pidx], quantity: qty, price, tax: price * 0.05 * qty, lineTotal: lineTotal * 1.05 },
        });
      }
      const tax = subtotal * 0.05;
      const total = subtotal + tax;
      await prisma.order.update({ where: { id: order.id }, data: { subtotal, tax, total } });
      if (statusStr === 'COMPLETED') {
        await prisma.payment.create({ data: { orderId: order.id, amount: total, paymentMethod: orderIdx % 3 === 0 ? 'CASH' : orderIdx % 3 === 1 ? 'CARD' : 'UPI', status: 'COMPLETED' } });
        await prisma.receipt.create({ data: { orderId: order.id, receiptNo: `REC-${10000 + orderIdx}` } });
      }
      if (statusStr === 'QUEUED' || statusStr === 'PREPARING') {
        await prisma.kitchenOrder.create({ data: { orderId: order.id, status: statusStr === 'QUEUED' ? 'TO_COOK' : 'PREPARING' } });
      }
      orderIdx++;
    };

    // 25 completed (past)
    for (let i = 0; i < 25; i++) await createOrder('COMPLETED', 30 - i, customerIds[i], i);
    // 10 today completed
    for (let i = 0; i < 10; i++) await createOrder('COMPLETED', 0, customerIds[i + 25], i + 5);
    // 8 queued (kitchen)
    for (let i = 0; i < 8; i++) await createOrder('QUEUED', 0, null, i);
    // 4 preparing
    for (let i = 0; i < 4; i++) await createOrder('PREPARING', 0, null, i + 4);
    // 3 cancelled
    for (let i = 0; i < 3; i++) await createOrder('CANCELLED', 1, customerIds[i + 50], i + 8);

    console.log(`✅ 50 orders created`);
  } else {
    console.log(`ℹ️  Orders already seeded (${existingOrderCount} found)`);
  }

  // ── 12. BOOKINGS ──────────────────────────────────────────────────────────
  const existingBookings = await prisma.booking.count({ where: { adminId: admin.id } });
  if (existingBookings < 5) {
    for (let i = 0; i < 20; i++) {
      await prisma.booking.create({
        data: {
          adminId: admin.id,
          tableId: tableRecords[i % tableRecords.length].id,
          customerId: customerIds[i % customerIds.length],
          bookingTime: new Date(Date.now() + i * 3600000 * 24),
          partySize: 2 + (i % 4),
          status: i % 3 === 0 ? 'Pending' : 'Confirmed',
        },
      });
    }
    console.log('✅ 20 bookings');
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo accounts:');
  console.log('  ADMIN    → admin@odfe.local      / Admin@123');
  console.log('  CASHIER  → cashier1@odfe.local   / Cashier@123 → /pos');
  console.log('  ORDERS   → cashier2@odfe.local   / Cashier@123 → /orders');
  console.log('  KITCHEN  → kitchen@odfe.local    / Kitchen@123 → /kitchen');
  console.log('  BILLING  → billing@odfe.local    / Billing@123 → /payments');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
