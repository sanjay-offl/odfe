import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants";
import { ApiResponse } from "../interfaces";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getCustomers = async (
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

    const customers = await prisma.customer.findMany({
      where: { adminId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    const response: ApiResponse = {
      success: true,
      message: "Customers retrieved successfully",
      data: customers,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (
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

    const customer = await prisma.customer.findFirst({
      where: { id, adminId, deletedAt: null },
      include: { orders: true, bookings: true },
    });

    if (!customer) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: "Customer retrieved successfully",
      data: customer,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (
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

    const { name, phone, email, address, birthday, membership } = req.body;

    const customer = await prisma.customer.create({
      data: {
        adminId,
        name,
        phone,
        email,
        address,
        birthday: birthday ? new Date(birthday) : undefined,
        membership,
      },
    });

    const response: ApiResponse = {
      success: true,
      message: "Customer created successfully",
      data: customer,
    };

    res.status(HTTP_STATUS.CREATED).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (
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

    const existing = await prisma.customer.findFirst({
      where: { id, adminId, deletedAt: null },
    });

    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    const { name, phone, email, address, birthday, membership } = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone,
        email,
        address,
        birthday: birthday ? new Date(birthday) : undefined,
        membership,
      },
    });

    const response: ApiResponse = {
      success: true,
      message: "Customer updated successfully",
      data: customer,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (
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

    const existing = await prisma.customer.findFirst({
      where: { id, adminId, deletedAt: null },
    });

    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    const response: ApiResponse = {
      success: true,
      message: "Customer deleted successfully",
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};
