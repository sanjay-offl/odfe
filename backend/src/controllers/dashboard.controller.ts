import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants";
import { ApiResponse } from "../interfaces";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDashboardData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    let adminId = userId;
    const emp = await prisma.employee.findUnique({ where: { userId } });
    if (emp) {
      adminId = emp.adminId;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const todayOrders = await prisma.order.findMany({
      where: {
        adminId,
        createdAt: { gte: today },
      },
    });

    const ordersCount = todayOrders.length;
    const totalRevenue = todayOrders.reduce((acc, order) => acc + order.total, 0);
    const avgOrder = ordersCount > 0 ? (totalRevenue / ordersCount).toFixed(2) : "0";

    const tables = await prisma.table.findMany({ where: { adminId } });
    const totalTablesCount = tables.length || 0;
    const activeTablesCount = tables.filter((t) => t.status === "OCCUPIED").length;

    const totalCustomers = await prisma.customer.count({ where: { adminId } });
    const totalEmployees = await prisma.employee.count({ where: { adminId, status: 'Active' } });
    const totalProducts = await prisma.product.count({ where: { adminId } });
    const totalBookings = await prisma.booking.count({ where: { adminId } });

    const kpis = [
      { label: "Today's Revenue", value: `₹${totalRevenue.toLocaleString()}`, change: "+0%", up: true },
      { label: "Orders Today", value: ordersCount.toString(), change: "+0%", up: true },
      { label: "Avg Order Value", value: `₹${avgOrder}`, change: "+0%", up: true },
      { label: "Active Tables", value: `${activeTablesCount}/${totalTablesCount}`, change: "0%", up: true },
    ];

    const recentOrdersRaw = await prisma.order.findMany({
      where: { adminId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { table: true, items: true }
    });

    const recentOrders = recentOrdersRaw.map((order) => ({
      id: order.orderNo,
      table: order.table?.name || "Takeaway",
      items: order.items.reduce((acc, item) => acc + item.quantity, 0),
      total: `₹${order.total.toFixed(2)}`,
      status: order.status,
    }));

    const lowStockInventory = await prisma.inventory.findMany({
      where: {
        adminId,
        stock: { lte: 10 }
      },
      include: { product: true },
      orderBy: { stock: 'asc' },
      take: 8,
    });

    const lowStock = lowStockInventory.map(inv => ({
      name: inv.product.name,
      stock: inv.stock,
      minimumStock: inv.minimumStock,
    }));

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          adminId,
          createdAt: { gte: thirtyDaysAgo }
        }
      },
      include: { product: true }
    });

    const productCounts: Record<string, { name: string, count: number }> = {};
    orderItems.forEach(item => {
      if (!productCounts[item.productId]) {
        productCounts[item.productId] = { name: item.product.name, count: 0 };
      }
      productCounts[item.productId].count += item.quantity;
    });

    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map(p => ({
        name: p.name,
        count: p.count,
        percentage: Math.min((p.count / Math.max(ordersCount, 1)) * 100, 100)
      }));

    const ordersThirtyDays = await prisma.order.findMany({
      where: {
        adminId,
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { createdAt: true, total: true }
    });

    const revByDate: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      revByDate[dateStr] = 0;
    }

    ordersThirtyDays.forEach(o => {
      const dateStr = o.createdAt.toISOString().split('T')[0];
      if (revByDate[dateStr] !== undefined) {
        revByDate[dateStr] += o.total;
      }
    });

    const revenueChart = Object.keys(revByDate).map(date => ({
      date: date.substring(5).replace('-', '/'),
      revenue: revByDate[date]
    }));

    const response: ApiResponse = {
      success: true,
      message: "Dashboard data retrieved successfully",
      data: {
        kpis,
        recentOrders,
        topProducts,
        lowStock,
        revenueChart,
        totalCustomers,
        totalEmployees,
        totalProducts,
        totalTables: totalTablesCount,
        totalBookings,
      },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};