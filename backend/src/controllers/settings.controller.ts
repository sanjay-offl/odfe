import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants";
import { ApiResponse } from "../interfaces";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getSettings = async (
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

    let settings = await prisma.businessSetting.findUnique({
      where: { adminId },
    });

    if (!settings) {
      settings = await prisma.businessSetting.create({
        data: {
          adminId,
          cafeName: "ODFE Cafe",
          currency: "₹ INR",
          timezone: "Asia/Kolkata",
          taxRate: 5.0,
          language: "English",
          receiptFooter: "Thank you for visiting ODFE Cafe",
        },
      });
    }

    const response: ApiResponse = {
      success: true,
      message: "Settings retrieved successfully",
      data: settings,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (
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

    const {
      cafeName,
      logo,
      currency,
      timezone,
      taxRate,
      language,
      receiptFooter,
      gstNumber,
      phone,
      address,
    } = req.body;

    const settings = await prisma.businessSetting.upsert({
      where: { adminId },
      update: {
        cafeName,
        logo,
        currency,
        timezone,
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : undefined,
        language,
        receiptFooter,
        gstNumber,
        phone,
        address,
      },
      create: {
        adminId,
        cafeName: cafeName || "ODFE Cafe",
        currency: currency || "₹ INR",
        timezone: timezone || "Asia/Kolkata",
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : 5.0,
        language: language || "English",
        receiptFooter: receiptFooter || "Thank you for visiting ODFE Cafe",
        gstNumber,
        phone,
        address,
      },
    });

    const response: ApiResponse = {
      success: true,
      message: "Settings updated successfully",
      data: settings,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};
