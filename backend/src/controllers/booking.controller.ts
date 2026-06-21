import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants";
import { ApiResponse } from "../interfaces";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getBookings = async (
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

    const bookings = await prisma.booking.findMany({
      where: { adminId, deletedAt: null },
      include: { table: true, customer: true },
      orderBy: { bookingTime: "desc" },
    });

    const response: ApiResponse = {
      success: true,
      message: "Bookings retrieved successfully",
      data: bookings,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (
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

    const { tableId, customerId, bookingTime, partySize, status } = req.body;

    const table = await prisma.table.findFirst({
      where: { id: tableId, adminId, deletedAt: null },
    });

    if (!table) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Table not found",
      });
      return;
    }

    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, adminId, deletedAt: null },
      });

      if (!customer) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Customer not found",
        });
        return;
      }
    }

    const booking = await prisma.booking.create({
      data: {
        adminId,
        tableId,
        customerId,
        bookingTime: new Date(bookingTime),
        partySize: parseInt(partySize, 10),
        status: status || "Confirmed",
      },
      include: { table: true, customer: true },
    });

    const response: ApiResponse = {
      success: true,
      message: "Booking created successfully",
      data: booking,
    };

    res.status(HTTP_STATUS.CREATED).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (
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

    const existing = await prisma.booking.findFirst({
      where: { id, adminId, deletedAt: null },
    });

    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    const { tableId, customerId, bookingTime, partySize, status } = req.body;

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        tableId,
        customerId,
        bookingTime: bookingTime ? new Date(bookingTime) : undefined,
        partySize: partySize !== undefined ? parseInt(partySize, 10) : undefined,
        status,
      },
      include: { table: true, customer: true },
    });

    const response: ApiResponse = {
      success: true,
      message: "Booking updated successfully",
      data: booking,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteBooking = async (
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

    const existing = await prisma.booking.findFirst({
      where: { id, adminId, deletedAt: null },
    });

    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    await prisma.booking.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    const response: ApiResponse = {
      success: true,
      message: "Booking deleted successfully",
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};
