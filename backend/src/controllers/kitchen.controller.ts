import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants";
import { ApiResponse } from "../interfaces";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getKitchenOrders = async (
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

    // @ts-ignore
    const kitchenOrders = await prisma.kitchenOrder.findMany({
      // @ts-ignore
      where: { adminId },
      include: {
        order: {
          include: {
            items: { include: { product: true } },
            table: true,
            employee: true,
            customer: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const response: ApiResponse = {
      success: true,
      message: "Kitchen orders retrieved successfully",
      data: kitchenOrders,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateKitchenOrderStatus = async (
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

    // @ts-ignore
    const existing = await prisma.kitchenOrder.findFirst({
      // @ts-ignore
      where: { id, adminId },
      include: { order: true },
    });

    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Kitchen order not found" });
      return;
    }

    const kitchenOrder = await prisma.kitchenOrder.update({
      where: { id },
      data: { status },
    });

    // @ts-ignore
    if (status === 'COMPLETED' && existing?.order?.status !== 'COMPLETED' && existing?.order?.status !== 'CANCELLED') {
      await prisma.order.update({
        where: { id: existing.orderId },
        // @ts-ignore
        data: { status: 'COMPLETED' },
      });
    }

    const response: ApiResponse = {
      success: true,
      message: "Kitchen order status updated",
      data: kitchenOrder,
    };
    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};