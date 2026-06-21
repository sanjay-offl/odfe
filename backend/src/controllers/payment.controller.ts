import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants";
import { ApiResponse } from "../interfaces";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getPaymentMethods = async (
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

    const methods = await prisma.paymentMethod.findMany({
      where: { adminId, deletedAt: null },
      orderBy: { name: "asc" },
    });

    const response: ApiResponse = {
      success: true,
      message: "Payment methods retrieved successfully",
      data: methods,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (
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

    const { orderId, amount, paymentMethod, transactionId } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: orderId, adminId },
    });

    if (!order) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod.toUpperCase(),
        status: "COMPLETED",
        transactionId,
      },
    });

    const response: ApiResponse = {
      success: true,
      message: "Payment transaction created successfully",
      data: payment,
    };

    res.status(HTTP_STATUS.CREATED).json(response);
  } catch (error) {
    next(error);
  }
};
