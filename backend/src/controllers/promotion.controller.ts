import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants";
import { ApiResponse } from "../interfaces";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getPromotions = async (
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

    const promotions = await prisma.promotion.findMany({
      where: { adminId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    const response: ApiResponse = {
      success: true,
      message: "Promotions retrieved successfully",
      data: promotions,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const createPromotion = async (
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

    const { name, description, startDate, endDate, isActive } = req.body;

    const promotion = await prisma.promotion.create({
      data: {
        adminId,
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    const response: ApiResponse = {
      success: true,
      message: "Promotion created successfully",
      data: promotion,
    };

    res.status(HTTP_STATUS.CREATED).json(response);
  } catch (error) {
    next(error);
  }
};

export const updatePromotion = async (
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

    const existing = await prisma.promotion.findFirst({
      where: { id, adminId, deletedAt: null },
    });

    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Promotion not found",
      });
      return;
    }

    const { name, description, startDate, endDate, isActive } = req.body;

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        name,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
      },
    });

    const response: ApiResponse = {
      success: true,
      message: "Promotion updated successfully",
      data: promotion,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const deletePromotion = async (
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

    const existing = await prisma.promotion.findFirst({
      where: { id, adminId, deletedAt: null },
    });

    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Promotion not found",
      });
      return;
    }

    await prisma.promotion.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    const response: ApiResponse = {
      success: true,
      message: "Promotion deleted successfully",
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};
