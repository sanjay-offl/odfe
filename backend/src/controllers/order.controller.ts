import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants";
import { ApiResponse } from "../interfaces";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { items, subtotal, tax, total, paymentMethod, tableId, customerId } = req.body;
    
    let orderNo = `ORD-${Math.floor(Math.random() * 100000)}`;

    const user = (req as any).user;
    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
      return;
    }

    let adminId = user.id;
    let employeeId: string | null = null;
    const emp = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (emp) {
      adminId = emp.adminId;
      employeeId = emp.id;
    }

    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNo,
          adminId,
          status: paymentMethod === 'CASH' || paymentMethod === 'CARD' || paymentMethod === 'UPI' ? 'QUEUED' : 'PENDING',
          subtotal: subtotal || 0,
          tax: tax || 0,
          total: total || 0,
          tableId: tableId || null,
          customerId: customerId || null,
          employeeId: employeeId || null,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              lineTotal: (item.price * item.quantity) * 1.05,
              notes: item.notes
            }))
          },
          payments: {
            create: [{
              amount: total || 0,
              paymentMethod: paymentMethod || 'CASH',
              status: 'COMPLETED'
            }]
          }
        }
      });

      // @ts-ignore
      await tx.kitchenOrder.create({
        data: {
          orderId: order.id,
          // @ts-ignore
          adminId,
          status: 'TO_COOK',
        }
      });

      await tx.receipt.create({
        data: {
          orderId: order.id,
          receiptNo: `REC-${Math.floor(Math.random() * 100000)}`,
        }
      });

      return order;
    });

    const response: ApiResponse = {
      success: true,
      message: "Order created successfully",
      data: {
        id: newOrder.id,
        orderNo: newOrder.orderNo,
        status: newOrder.status
      },
    };

    res.status(HTTP_STATUS.CREATED).json(response);
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (
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

    const orders = await prisma.order.findMany({
      where: { adminId },
      include: {
        items: { include: { product: true } },
        table: true,
        customer: true,
        employee: true,
        kitchenOrders: true,
        payments: true,
        receipts: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const response: ApiResponse = {
      success: true,
      message: "Orders retrieved successfully",
      data: orders,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).user?.id;
    let adminId = userId;
    const emp = await prisma.employee.findUnique({ where: { userId } });
    if (emp) {
      adminId = emp.adminId;
    }

    const order = await prisma.order.findFirst({
      where: { orderNo: id, adminId },
    });

    if (!order) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Order not found" });
      return;
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: status as any }
    });

    const response: ApiResponse = {
      success: true,
      message: "Order status updated",
      data: updated,
    };
    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};