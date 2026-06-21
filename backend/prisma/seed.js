"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var supabase_js_1 = require("@supabase/supabase-js");
var dotenv = __importStar(require("dotenv"));
var path_1 = __importDefault(require("path"));
var ws_1 = __importDefault(require("ws"));
dotenv.config({ path: path_1.default.resolve(__dirname, '../.env') });
var prisma = new client_1.PrismaClient();
var supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '', { auth: { persistSession: false }, realtime: { transport: ws_1.default } });
var supabaseAdmin = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '', { auth: { autoRefreshToken: false, persistSession: false }, realtime: { transport: ws_1.default } });
function upsertSupabaseUser(email, password, name, fallbackId) {
    return __awaiter(this, void 0, void 0, function () {
        var userId, _a, users, listError, existingUser, _1, updateError, _b, createData, createError;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
                        throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to create auth users via Admin API.');
                    }
                    userId = '';
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, supabaseAdmin.auth.admin.listUsers()];
                case 2:
                    _a = _d.sent(), users = _a.data.users, listError = _a.error;
                    if (!listError) {
                        existingUser = users.find(function (u) { return u.email === email; });
                        if (existingUser)
                            userId = existingUser.id;
                    }
                    return [3 /*break*/, 4];
                case 3:
                    _1 = _d.sent();
                    return [3 /*break*/, 4];
                case 4:
                    if (!userId) return [3 /*break*/, 6];
                    return [4 /*yield*/, supabaseAdmin.auth.admin.updateUserById(userId, {
                            password: password,
                            user_metadata: { full_name: name },
                            email_confirm: true
                        })];
                case 5:
                    updateError = (_d.sent()).error;
                    if (updateError)
                        console.error("Error updating user ".concat(email, ":"), updateError.message);
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, supabaseAdmin.auth.admin.createUser({
                        email: email,
                        password: password,
                        email_confirm: true,
                        user_metadata: { full_name: name }
                    })];
                case 7:
                    _b = _d.sent(), createData = _b.data, createError = _b.error;
                    if (createError) {
                        throw new Error("Error creating user ".concat(email, ": ").concat(createError.message));
                    }
                    if ((_c = createData === null || createData === void 0 ? void 0 : createData.user) === null || _c === void 0 ? void 0 : _c.id)
                        userId = createData.user.id;
                    _d.label = 8;
                case 8: return [2 /*return*/, userId || fallbackId];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var adminId, admin, empData, employeeRecords, _i, empData_1, emp, uid, u, e, _a, _b, pm, catDefs, catMap, _c, catDefs_1, cat, existing, c, _d, prodDefs, productIds, productRefs, i, p, existing, prod, inv, floorDefs, tableRecords, tableNum, _e, floorDefs_1, fd, floor, i, tname, table, status_1, cap, custNames, customerIds, i, name_1, existing, cust, couponDefs, _f, couponDefs_1, c, ex, promoDefs, _g, promoDefs_1, name_2, ex, existingSession, existingOrderCount, orderIdx_1, emp1_1, createOrder, i, i, i, i, i, existingBookings, i;
        var _this = this;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    console.log('🌱 Starting ODFE seed...');
                    return [4 /*yield*/, upsertSupabaseUser('admin@odfe.local', 'Admin@123', 'ODFE Admin', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')];
                case 1:
                    adminId = _h.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'admin@odfe.local' },
                            update: { name: 'ODFE Admin', role: 'ADMIN', plan: 'PRO', isActive: true },
                            create: { id: adminId, email: 'admin@odfe.local', name: 'ODFE Admin', role: 'ADMIN', plan: 'PRO', isActive: true },
                        })];
                case 2:
                    admin = _h.sent();
                    return [4 /*yield*/, prisma.businessSetting.upsert({
                            where: { adminId: admin.id },
                            update: {},
                            create: {
                                adminId: admin.id, cafeName: 'ODFE Cafe', currency: '₹ INR', timezone: 'Asia/Kolkata',
                                taxRate: 5.0, language: 'English', receiptFooter: 'Thank you for visiting ODFE Cafe!',
                                gstNumber: '33ABCDE1234F1Z5', phone: '+91 9876543210', address: 'Coimbatore, Tamil Nadu',
                            },
                        })];
                case 3:
                    _h.sent();
                    console.log('✅ Admin created:', admin.email);
                    empData = [
                        { name: 'Arun Kumar', email: 'cashier1@odfe.local', pass: 'Cashier@123', no: 'EMP001', position: 'Cashier', shift: 'Morning', fid: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01' },
                        { name: 'Priya', email: 'cashier2@odfe.local', pass: 'Cashier@123', no: 'EMP002', position: 'Orders', shift: 'Evening', fid: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02' },
                        { name: 'Rahul', email: 'kitchen@odfe.local', pass: 'Kitchen@123', no: 'EMP003', position: 'Kitchen', shift: 'Morning', fid: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03' },
                        { name: 'Sneha', email: 'billing@odfe.local', pass: 'Billing@123', no: 'EMP004', position: 'Billing', shift: 'Evening', fid: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04' },
                        { name: 'Karthik', email: 'cashier3@odfe.local', pass: 'Cashier@123', no: 'EMP005', position: 'Cashier', shift: 'Weekend', fid: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb05' },
                    ];
                    employeeRecords = [];
                    _i = 0, empData_1 = empData;
                    _h.label = 4;
                case 4:
                    if (!(_i < empData_1.length)) return [3 /*break*/, 9];
                    emp = empData_1[_i];
                    return [4 /*yield*/, upsertSupabaseUser(emp.email, emp.pass, emp.name, emp.fid)];
                case 5:
                    uid = _h.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: emp.email },
                            update: { name: emp.name, role: 'EMPLOYEE' },
                            create: { id: uid, email: emp.email, name: emp.name, role: 'EMPLOYEE', plan: 'FREE' },
                        })];
                case 6:
                    u = _h.sent();
                    return [4 /*yield*/, prisma.employee.upsert({
                            where: { email: emp.email },
                            update: { position: emp.position, shift: emp.shift },
                            create: {
                                userId: u.id, adminId: admin.id, name: emp.name, email: emp.email,
                                employeeNo: emp.no, position: emp.position, shift: emp.shift,
                                hourlyRate: 180.0, hireDate: new Date('2024-01-01'), status: 'Active',
                            },
                        })];
                case 7:
                    e = _h.sent();
                    employeeRecords.push(e);
                    console.log("\u2705 Employee: ".concat(emp.email, " (").concat(emp.position, ")"));
                    _h.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 4];
                case 9:
                    _a = 0, _b = [
                        { name: 'Cash', upiId: null },
                        { name: 'Card', upiId: null },
                        { name: 'UPI', upiId: 'odfe@ybl' },
                        { name: 'Wallet', upiId: null },
                    ];
                    _h.label = 10;
                case 10:
                    if (!(_a < _b.length)) return [3 /*break*/, 13];
                    pm = _b[_a];
                    return [4 /*yield*/, prisma.paymentMethod.upsert({
                            where: { adminId_name: { adminId: admin.id, name: pm.name } },
                            update: {},
                            create: { adminId: admin.id, name: pm.name, upiId: pm.upiId, isActive: true },
                        })];
                case 11:
                    _h.sent();
                    _h.label = 12;
                case 12:
                    _a++;
                    return [3 /*break*/, 10];
                case 13:
                    catDefs = [
                        { name: 'Coffee', color: '#6F4E37', icon: '☕' },
                        { name: 'Tea', color: '#8BC34A', icon: '🍵' },
                        { name: 'Pizza', color: '#FF5722', icon: '🍕' },
                        { name: 'Burger', color: '#FF9800', icon: '🍔' },
                        { name: 'Dessert', color: '#E91E63', icon: '🍰' },
                        { name: 'Quick Bites', color: '#F44336', icon: '🍟' },
                        { name: 'Cold Drinks', color: '#03A9F4', icon: '🥤' },
                    ];
                    catMap = {};
                    _c = 0, catDefs_1 = catDefs;
                    _h.label = 14;
                case 14:
                    if (!(_c < catDefs_1.length)) return [3 /*break*/, 21];
                    cat = catDefs_1[_c];
                    return [4 /*yield*/, prisma.category.findFirst({ where: { adminId: admin.id, name: cat.name } })];
                case 15:
                    existing = _h.sent();
                    if (!existing) return [3 /*break*/, 17];
                    return [4 /*yield*/, prisma.category.update({ where: { id: existing.id }, data: { color: cat.color } })];
                case 16:
                    _d = _h.sent();
                    return [3 /*break*/, 19];
                case 17: return [4 /*yield*/, prisma.category.create({ data: { adminId: admin.id, name: cat.name, color: cat.color } })];
                case 18:
                    _d = _h.sent();
                    _h.label = 19;
                case 19:
                    c = _d;
                    catMap[cat.name] = c.id;
                    _h.label = 20;
                case 20:
                    _c++;
                    return [3 /*break*/, 14];
                case 21:
                    console.log('✅ Categories created');
                    prodDefs = [
                        // Coffee (10)
                        { name: 'Espresso', cat: 'Coffee', price: 120, cost: 40, img: '☕', sku: 'SKU-C01' },
                        { name: 'Americano', cat: 'Coffee', price: 150, cost: 50, img: '☕', sku: 'SKU-C02' },
                        { name: 'Latte', cat: 'Coffee', price: 180, cost: 70, img: '☕', sku: 'SKU-C03' },
                        { name: 'Cappuccino', cat: 'Coffee', price: 180, cost: 70, img: '☕', sku: 'SKU-C04' },
                        { name: 'Mocha', cat: 'Coffee', price: 200, cost: 80, img: '☕', sku: 'SKU-C05' },
                        { name: 'Flat White', cat: 'Coffee', price: 190, cost: 75, img: '☕', sku: 'SKU-C06' },
                        { name: 'Cold Brew', cat: 'Coffee', price: 220, cost: 90, img: '☕', sku: 'SKU-C07' },
                        { name: 'Affogato', cat: 'Coffee', price: 250, cost: 100, img: '☕', sku: 'SKU-C08' },
                        { name: 'Macchiato', cat: 'Coffee', price: 160, cost: 60, img: '☕', sku: 'SKU-C09' },
                        { name: 'Irish Coffee', cat: 'Coffee', price: 280, cost: 110, img: '☕', sku: 'SKU-C10' },
                        // Tea (5)
                        { name: 'Masala Tea', cat: 'Tea', price: 60, cost: 20, img: '🍵', sku: 'SKU-T01' },
                        { name: 'Green Tea', cat: 'Tea', price: 90, cost: 25, img: '🍵', sku: 'SKU-T02' },
                        { name: 'Ginger Tea', cat: 'Tea', price: 70, cost: 22, img: '🍵', sku: 'SKU-T03' },
                        { name: 'Lemon Tea', cat: 'Tea', price: 80, cost: 25, img: '🍵', sku: 'SKU-T04' },
                        { name: 'Cardamom Tea', cat: 'Tea', price: 80, cost: 25, img: '🍵', sku: 'SKU-T05' },
                        // Pizza (5)
                        { name: 'Margherita Pizza', cat: 'Pizza', price: 280, cost: 110, img: '🍕', sku: 'SKU-P01' },
                        { name: 'Farmhouse Pizza', cat: 'Pizza', price: 360, cost: 150, img: '🍕', sku: 'SKU-P02' },
                        { name: 'Pepperoni Pizza', cat: 'Pizza', price: 380, cost: 160, img: '🍕', sku: 'SKU-P03' },
                        { name: 'BBQ Chicken Pizza', cat: 'Pizza', price: 400, cost: 170, img: '🍕', sku: 'SKU-P04' },
                        { name: 'Veggie Supreme', cat: 'Pizza', price: 320, cost: 130, img: '🍕', sku: 'SKU-P05' },
                        // Burger (5)
                        { name: 'Veg Burger', cat: 'Burger', price: 150, cost: 55, img: '🍔', sku: 'SKU-B01' },
                        { name: 'Chicken Burger', cat: 'Burger', price: 220, cost: 90, img: '🍔', sku: 'SKU-B02' },
                        { name: 'Double Patty', cat: 'Burger', price: 280, cost: 120, img: '🍔', sku: 'SKU-B03' },
                        { name: 'Paneer Burger', cat: 'Burger', price: 190, cost: 75, img: '🍔', sku: 'SKU-B04' },
                        { name: 'Mushroom Burger', cat: 'Burger', price: 200, cost: 80, img: '🍔', sku: 'SKU-B05' },
                        // Dessert (5)
                        { name: 'Brownie', cat: 'Dessert', price: 120, cost: 50, img: '🍰', sku: 'SKU-D01' },
                        { name: 'Chocolate Cake', cat: 'Dessert', price: 200, cost: 80, img: '🍰', sku: 'SKU-D02' },
                        { name: 'Cheesecake', cat: 'Dessert', price: 250, cost: 100, img: '🍰', sku: 'SKU-D03' },
                        { name: 'Ice Cream', cat: 'Dessert', price: 95, cost: 35, img: '🍦', sku: 'SKU-D04' },
                        { name: 'Belgian Waffle', cat: 'Dessert', price: 240, cost: 95, img: '🧇', sku: 'SKU-D05' },
                        // Quick Bites (5)
                        { name: 'French Fries', cat: 'Quick Bites', price: 110, cost: 35, img: '🍟', sku: 'SKU-Q01' },
                        { name: 'Garlic Bread', cat: 'Quick Bites', price: 130, cost: 45, img: '🥖', sku: 'SKU-Q02' },
                        { name: 'Sandwich', cat: 'Quick Bites', price: 140, cost: 50, img: '🥪', sku: 'SKU-Q03' },
                        { name: 'Croissant', cat: 'Quick Bites', price: 120, cost: 45, img: '🥐', sku: 'SKU-Q04' },
                        { name: 'Nachos', cat: 'Quick Bites', price: 160, cost: 60, img: '🌮', sku: 'SKU-Q05' },
                        // Cold Drinks (5)
                        { name: 'Cold Coffee', cat: 'Cold Drinks', price: 160, cost: 60, img: '🥤', sku: 'SKU-CD1' },
                        { name: 'Mango Smoothie', cat: 'Cold Drinks', price: 180, cost: 70, img: '🥭', sku: 'SKU-CD2' },
                        { name: 'Lemonade', cat: 'Cold Drinks', price: 100, cost: 30, img: '🍋', sku: 'SKU-CD3' },
                        { name: 'Iced Tea', cat: 'Cold Drinks', price: 120, cost: 40, img: '🧊', sku: 'SKU-CD4' },
                        { name: 'Orange Juice', cat: 'Cold Drinks', price: 140, cost: 55, img: '🍊', sku: 'SKU-CD5' },
                    ];
                    productIds = [];
                    productRefs = [];
                    i = 0;
                    _h.label = 22;
                case 22:
                    if (!(i < prodDefs.length)) return [3 /*break*/, 31];
                    p = prodDefs[i];
                    return [4 /*yield*/, prisma.product.findFirst({ where: { adminId: admin.id, name: p.name } })];
                case 23:
                    existing = _h.sent();
                    prod = void 0;
                    if (!existing) return [3 /*break*/, 25];
                    return [4 /*yield*/, prisma.product.update({ where: { id: existing.id }, data: { price: p.price, costPrice: p.cost } })];
                case 24:
                    prod = _h.sent();
                    return [3 /*break*/, 27];
                case 25: return [4 /*yield*/, prisma.product.create({
                        data: {
                            adminId: admin.id, categoryId: catMap[p.cat], name: p.name,
                            price: p.price, costPrice: p.cost, taxRate: 5.0,
                            sku: p.sku, barcode: "8901234".concat(5000 + i), image: p.img, isActive: true,
                        },
                    })];
                case 26:
                    prod = _h.sent();
                    _h.label = 27;
                case 27:
                    productIds.push(prod.id);
                    productRefs.push(p);
                    return [4 /*yield*/, prisma.inventory.findFirst({ where: { productId: prod.id } })];
                case 28:
                    inv = _h.sent();
                    if (!!inv) return [3 /*break*/, 30];
                    return [4 /*yield*/, prisma.inventory.create({ data: { adminId: admin.id, productId: prod.id, stock: 150, minimumStock: 20 } })];
                case 29:
                    _h.sent();
                    _h.label = 30;
                case 30:
                    i++;
                    return [3 /*break*/, 22];
                case 31:
                    console.log("\u2705 ".concat(prodDefs.length, " products created"));
                    floorDefs = [
                        { name: 'Ground Floor', desc: 'Indoor Seating', tables: 10 },
                        { name: 'First Floor', desc: 'Balcony View', tables: 8 },
                        { name: 'Outdoor', desc: 'Garden Area', tables: 8 },
                        { name: 'VIP Lounge', desc: 'Private Dining', tables: 4 },
                    ];
                    tableRecords = [];
                    tableNum = 1;
                    _e = 0, floorDefs_1 = floorDefs;
                    _h.label = 32;
                case 32:
                    if (!(_e < floorDefs_1.length)) return [3 /*break*/, 43];
                    fd = floorDefs_1[_e];
                    return [4 /*yield*/, prisma.floor.findFirst({ where: { adminId: admin.id, name: fd.name } })];
                case 33:
                    floor = _h.sent();
                    if (!!floor) return [3 /*break*/, 35];
                    return [4 /*yield*/, prisma.floor.create({ data: { adminId: admin.id, name: fd.name, description: fd.desc } })];
                case 34:
                    floor = _h.sent();
                    _h.label = 35;
                case 35:
                    i = 0;
                    _h.label = 36;
                case 36:
                    if (!(i < fd.tables)) return [3 /*break*/, 42];
                    tname = "T".concat(tableNum);
                    return [4 /*yield*/, prisma.table.findFirst({ where: { adminId: admin.id, name: tname } })];
                case 37:
                    table = _h.sent();
                    if (!!table) return [3 /*break*/, 40];
                    status_1 = tableNum % 4 === 0 ? 'OCCUPIED' : tableNum % 7 === 0 ? 'RESERVED' : 'AVAILABLE';
                    cap = tableNum % 3 === 0 ? 6 : tableNum % 5 === 0 ? 8 : 4;
                    return [4 /*yield*/, prisma.table.create({ data: { adminId: admin.id, floorId: floor.id, name: tname, capacity: cap, status: status_1 } })];
                case 38:
                    table = _h.sent();
                    return [4 /*yield*/, prisma.qrCode.create({ data: { adminId: admin.id, tableId: table.id, token: "tbl-".concat(tname.toLowerCase()), url: "http://localhost:3001/s/tbl-".concat(tname.toLowerCase()) } })];
                case 39:
                    _h.sent();
                    _h.label = 40;
                case 40:
                    tableRecords.push(table);
                    tableNum++;
                    _h.label = 41;
                case 41:
                    i++;
                    return [3 /*break*/, 36];
                case 42:
                    _e++;
                    return [3 /*break*/, 32];
                case 43:
                    console.log("\u2705 ".concat(tableRecords.length, " tables across ").concat(floorDefs.length, " floors"));
                    custNames = [
                        'Aarav Patel', 'Vihaan Sharma', 'Ananya Gupta', 'Diya Kumar', 'Advik Desai',
                        'Riya Joshi', 'Kabir Mehta', 'Neha Shah', 'Sai Iyer', 'Arjun Reddy',
                        'Kavya Menon', 'Ishaan Bhat', 'Mira Pillai', 'Krishna Rao', 'Rohan Das',
                        'Aditi Bose', 'Zara Ali', 'Omar Khan', 'Tanvi Nair', 'Raj Verma',
                    ];
                    customerIds = [];
                    i = 0;
                    _h.label = 44;
                case 44:
                    if (!(i < 100)) return [3 /*break*/, 50];
                    name_1 = custNames[i % custNames.length] + (i >= custNames.length ? " ".concat(Math.floor(i / custNames.length) + 1) : '');
                    return [4 /*yield*/, prisma.customer.findFirst({ where: { adminId: admin.id, email: "customer".concat(i, "@odfe.com") } })];
                case 45:
                    existing = _h.sent();
                    cust = void 0;
                    if (!existing) return [3 /*break*/, 46];
                    cust = existing;
                    return [3 /*break*/, 48];
                case 46: return [4 /*yield*/, prisma.customer.create({
                        data: {
                            adminId: admin.id,
                            name: name_1,
                            email: "customer".concat(i, "@odfe.com"),
                            phone: "+9198".concat(String(1000000 + i).slice(1)),
                            loyalty: Math.floor(Math.random() * 500),
                            visitCount: Math.floor(Math.random() * 30),
                            totalSpent: Math.floor(Math.random() * 15000),
                        },
                    })];
                case 47:
                    cust = _h.sent();
                    _h.label = 48;
                case 48:
                    customerIds.push(cust.id);
                    _h.label = 49;
                case 49:
                    i++;
                    return [3 /*break*/, 44];
                case 50:
                    console.log('✅ 100 customers');
                    couponDefs = [
                        { code: 'WELCOME20', discountType: 'percentage', discountValue: 20, minOrder: 200 },
                        { code: 'SAVE100', discountType: 'fixed', discountValue: 100, minOrder: 500 },
                        { code: 'FIRSTORDER', discountType: 'percentage', discountValue: 15, minOrder: 100 },
                        { code: 'SUMMER25', discountType: 'percentage', discountValue: 25, minOrder: 300 },
                        { code: 'COFFEE50', discountType: 'fixed', discountValue: 50, minOrder: 150 },
                    ];
                    _f = 0, couponDefs_1 = couponDefs;
                    _h.label = 51;
                case 51:
                    if (!(_f < couponDefs_1.length)) return [3 /*break*/, 55];
                    c = couponDefs_1[_f];
                    return [4 /*yield*/, prisma.coupon.findFirst({ where: { adminId: admin.id, code: c.code } })];
                case 52:
                    ex = _h.sent();
                    if (!!ex) return [3 /*break*/, 54];
                    return [4 /*yield*/, prisma.coupon.create({ data: { adminId: admin.id, code: c.code, discountType: c.discountType, discountValue: c.discountValue, isActive: true } })];
                case 53:
                    _h.sent();
                    _h.label = 54;
                case 54:
                    _f++;
                    return [3 /*break*/, 51];
                case 55:
                    promoDefs = [
                        'Buy 2 Coffee – 20% Off',
                        'Spend ₹500 – Get ₹50 Discount',
                        'Buy Burger + Fries – Combo Discount',
                    ];
                    _g = 0, promoDefs_1 = promoDefs;
                    _h.label = 56;
                case 56:
                    if (!(_g < promoDefs_1.length)) return [3 /*break*/, 60];
                    name_2 = promoDefs_1[_g];
                    return [4 /*yield*/, prisma.promotion.findFirst({ where: { adminId: admin.id, name: name_2 } })];
                case 57:
                    ex = _h.sent();
                    if (!!ex) return [3 /*break*/, 59];
                    return [4 /*yield*/, prisma.promotion.create({
                            data: { adminId: admin.id, name: name_2, startDate: new Date(), endDate: new Date(Date.now() + 86400000 * 30) },
                        })];
                case 58:
                    _h.sent();
                    _h.label = 59;
                case 59:
                    _g++;
                    return [3 /*break*/, 56];
                case 60:
                    console.log('✅ Coupons & Promotions');
                    return [4 /*yield*/, prisma.session.findFirst({ where: { userId: admin.id, closedAt: null } })];
                case 61:
                    existingSession = _h.sent();
                    if (!!existingSession) return [3 /*break*/, 63];
                    return [4 /*yield*/, prisma.session.create({ data: { userId: admin.id, token: "demo-session-".concat(Date.now()), openingCash: 5000, openedAt: new Date() } })];
                case 62:
                    _h.sent();
                    _h.label = 63;
                case 63: return [4 /*yield*/, prisma.order.count({ where: { adminId: admin.id } })];
                case 64:
                    existingOrderCount = _h.sent();
                    if (!(existingOrderCount < 10)) return [3 /*break*/, 85];
                    orderIdx_1 = 1;
                    emp1_1 = employeeRecords[0];
                    createOrder = function (statusStr, daysAgo, custId, tableIdx) { return __awaiter(_this, void 0, void 0, function () {
                        var createdAt, order, numItems, subtotal, j, pidx, price, qty, lineTotal, tax, total;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    createdAt = new Date(Date.now() - daysAgo * 86400000 - Math.random() * 43200000);
                                    return [4 /*yield*/, prisma.order.create({
                                            data: {
                                                adminId: admin.id, orderNo: "ORD-".concat(10000 + orderIdx_1),
                                                tableId: tableRecords[tableIdx % tableRecords.length].id,
                                                customerId: custId, employeeId: emp1_1 === null || emp1_1 === void 0 ? void 0 : emp1_1.id,
                                                status: statusStr, subtotal: 0, tax: 0, total: 0,
                                                createdAt: createdAt,
                                            },
                                        })];
                                case 1:
                                    order = _a.sent();
                                    numItems = 2 + (orderIdx_1 % 3);
                                    subtotal = 0;
                                    j = 0;
                                    _a.label = 2;
                                case 2:
                                    if (!(j < numItems)) return [3 /*break*/, 5];
                                    pidx = (orderIdx_1 + j) % productIds.length;
                                    price = prodDefs[pidx].price;
                                    qty = 1 + (j % 2);
                                    lineTotal = price * qty;
                                    subtotal += lineTotal;
                                    return [4 /*yield*/, prisma.orderItem.create({
                                            data: { orderId: order.id, productId: productIds[pidx], quantity: qty, price: price, tax: price * 0.05 * qty, lineTotal: lineTotal * 1.05 },
                                        })];
                                case 3:
                                    _a.sent();
                                    _a.label = 4;
                                case 4:
                                    j++;
                                    return [3 /*break*/, 2];
                                case 5:
                                    tax = subtotal * 0.05;
                                    total = subtotal + tax;
                                    return [4 /*yield*/, prisma.order.update({ where: { id: order.id }, data: { subtotal: subtotal, tax: tax, total: total } })];
                                case 6:
                                    _a.sent();
                                    if (!(statusStr === 'COMPLETED')) return [3 /*break*/, 9];
                                    return [4 /*yield*/, prisma.payment.create({ data: { orderId: order.id, amount: total, paymentMethod: orderIdx_1 % 3 === 0 ? 'CASH' : orderIdx_1 % 3 === 1 ? 'CARD' : 'UPI', status: 'COMPLETED' } })];
                                case 7:
                                    _a.sent();
                                    return [4 /*yield*/, prisma.receipt.create({ data: { orderId: order.id, receiptNo: "REC-".concat(10000 + orderIdx_1) } })];
                                case 8:
                                    _a.sent();
                                    _a.label = 9;
                                case 9:
                                    if (!(statusStr === 'QUEUED' || statusStr === 'PREPARING')) return [3 /*break*/, 11];
                                    return [4 /*yield*/, prisma.kitchenOrder.create({ data: { orderId: order.id, status: statusStr === 'QUEUED' ? 'TO_COOK' : 'PREPARING' } })];
                                case 10:
                                    _a.sent();
                                    _a.label = 11;
                                case 11:
                                    orderIdx_1++;
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    i = 0;
                    _h.label = 65;
                case 65:
                    if (!(i < 25)) return [3 /*break*/, 68];
                    return [4 /*yield*/, createOrder('COMPLETED', 30 - i, customerIds[i], i)];
                case 66:
                    _h.sent();
                    _h.label = 67;
                case 67:
                    i++;
                    return [3 /*break*/, 65];
                case 68:
                    i = 0;
                    _h.label = 69;
                case 69:
                    if (!(i < 10)) return [3 /*break*/, 72];
                    return [4 /*yield*/, createOrder('COMPLETED', 0, customerIds[i + 25], i + 5)];
                case 70:
                    _h.sent();
                    _h.label = 71;
                case 71:
                    i++;
                    return [3 /*break*/, 69];
                case 72:
                    i = 0;
                    _h.label = 73;
                case 73:
                    if (!(i < 8)) return [3 /*break*/, 76];
                    return [4 /*yield*/, createOrder('QUEUED', 0, null, i)];
                case 74:
                    _h.sent();
                    _h.label = 75;
                case 75:
                    i++;
                    return [3 /*break*/, 73];
                case 76:
                    i = 0;
                    _h.label = 77;
                case 77:
                    if (!(i < 4)) return [3 /*break*/, 80];
                    return [4 /*yield*/, createOrder('PREPARING', 0, null, i + 4)];
                case 78:
                    _h.sent();
                    _h.label = 79;
                case 79:
                    i++;
                    return [3 /*break*/, 77];
                case 80:
                    i = 0;
                    _h.label = 81;
                case 81:
                    if (!(i < 3)) return [3 /*break*/, 84];
                    return [4 /*yield*/, createOrder('CANCELLED', 1, customerIds[i + 50], i + 8)];
                case 82:
                    _h.sent();
                    _h.label = 83;
                case 83:
                    i++;
                    return [3 /*break*/, 81];
                case 84:
                    console.log("\u2705 50 orders created");
                    return [3 /*break*/, 86];
                case 85:
                    console.log("\u2139\uFE0F  Orders already seeded (".concat(existingOrderCount, " found)"));
                    _h.label = 86;
                case 86: return [4 /*yield*/, prisma.booking.count({ where: { adminId: admin.id } })];
                case 87:
                    existingBookings = _h.sent();
                    if (!(existingBookings < 5)) return [3 /*break*/, 92];
                    i = 0;
                    _h.label = 88;
                case 88:
                    if (!(i < 20)) return [3 /*break*/, 91];
                    return [4 /*yield*/, prisma.booking.create({
                            data: {
                                adminId: admin.id,
                                tableId: tableRecords[i % tableRecords.length].id,
                                customerId: customerIds[i % customerIds.length],
                                bookingTime: new Date(Date.now() + i * 3600000 * 24),
                                partySize: 2 + (i % 4),
                                status: i % 3 === 0 ? 'Pending' : 'Confirmed',
                            },
                        })];
                case 89:
                    _h.sent();
                    _h.label = 90;
                case 90:
                    i++;
                    return [3 /*break*/, 88];
                case 91:
                    console.log('✅ 20 bookings');
                    _h.label = 92;
                case 92:
                    console.log('\n🎉 Seed complete!\n');
                    console.log('Demo accounts:');
                    console.log('  ADMIN    → admin@odfe.local      / Admin@123');
                    console.log('  CASHIER  → cashier1@odfe.local   / Cashier@123 → /pos');
                    console.log('  ORDERS   → cashier2@odfe.local   / Cashier@123 → /orders');
                    console.log('  KITCHEN  → kitchen@odfe.local    / Kitchen@123 → /kitchen');
                    console.log('  BILLING  → billing@odfe.local    / Billing@123 → /payments');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) { console.error(e); process.exit(1); })
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, prisma.$disconnect()];
        case 1:
            _a.sent();
            return [2 /*return*/];
    }
}); }); });
