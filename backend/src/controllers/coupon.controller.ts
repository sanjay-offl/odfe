import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants";
import { ApiResponse } from "../interfaces";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getCoupons = async (
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

    const coupons = await prisma.coupon.findMany({
      where: { adminId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    const response: ApiResponse = {
      success: true,
      message: "Coupons retrieved successfully",
      data: coupons,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (
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

    const { code, discountType, discountValue, validUntil, isActive } = req.body;

    const existing = await prisma.coupon.findUnique({
      where: { adminId_code: { adminId, code } },
    });

    if (existing && !existing.deletedAt) {
      res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: "A coupon with this code already exists",
      });
      return;
    }

    const coupon = await prisma.coupon.create({
      data: {
        adminId,
        code,
        discountType,
        discountValue: parseFloat(discountValue),
        validUntil: validUntil ? new Date(validUntil) : undefined,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    const response: ApiResponse = {
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    };

    res.status(HTTP_STATUS.CREATED).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    let adminId = userId;
    const emp = await prisma.employee.findUnique({ where: { userId } });
    if (emp) {
      adminId = emp.adminId;
    }

    const existing = await prisma.coupon.findFirst({
      where: { id, adminId, deletedAt: null },
    });

    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Coupon not found",
      });
      return;
    }

    const { code, discountType, discountValue, validUntil, isActive } = req.body;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code,
        discountType,
        discountValue: discountValue !== undefined ? parseFloat(discountValue) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        isActive,
      },
    });

    const response: ApiResponse = {
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    let adminId = userId;
    const emp = await prisma.employee.findUnique({ where: { userId } });
    if (emp) {
      adminId = emp.adminId;
    }

    const existing = await prisma.coupon.findFirst({
      where: { id, adminId, deletedAt: null },
    });

    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Coupon not found",
      });
      return;
    }

    await prisma.coupon.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    const response: ApiResponse = {
      success: true,
      message: "Coupon deleted successfully",
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};
