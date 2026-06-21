import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants";
import { ApiResponse } from "../interfaces";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getFloors = async (
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

    const floors = await prisma.floor.findMany({
      where: { adminId, deletedAt: null },
      include: { _count: { select: { tables: true } } },
      orderBy: { name: "asc" },
    });

    const response: ApiResponse = {
      success: true,
      message: "Floors retrieved successfully",
      data: floors,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const createFloor = async (
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

    const { name, description } = req.body;

    const floor = await prisma.floor.create({
      data: { adminId, name, description },
    });

    const response: ApiResponse = {
      success: true,
      message: "Floor created successfully",
      data: floor,
    };

    res.status(HTTP_STATUS.CREATED).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateFloor = async (
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

    const existing = await prisma.floor.findFirst({
      where: { id, adminId, deletedAt: null },
    });

    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Floor not found",
      });
      return;
    }

    const { name, description } = req.body;

    const floor = await prisma.floor.update({
      where: { id },
      data: { name, description },
    });

    const response: ApiResponse = {
      success: true,
      message: "Floor updated successfully",
      data: floor,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteFloor = async (
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

    const existing = await prisma.floor.findFirst({
      where: { id, adminId, deletedAt: null },
    });

    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Floor not found",
      });
      return;
    }

    await prisma.floor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    const response: ApiResponse = {
      success: true,
      message: "Floor deleted successfully",
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const getTables = async (
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

    const { floorId: floorIdFilter } = req.query;
    const whereClause: any = { adminId, deletedAt: null };
    if (floorIdFilter) whereClause.floorId = floorIdFilter as string;

    const tables = await prisma.table.findMany({
      where: whereClause,
      include: { floor: true },
      orderBy: [{ floorId: "asc" }, { name: "asc" }],
    });

    const response: ApiResponse = {
      success: true,
      message: "Tables retrieved successfully",
      data: tables,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const createTable = async (
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

    const { floorId, name, capacity, status } = req.body;

    if (floorId) {
      const floor = await prisma.floor.findFirst({
        where: { id: floorId, adminId, deletedAt: null },
      });

      if (!floor) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Floor not found",
        });
        return;
      }
    }

    const table = await prisma.table.create({
      data: {
        adminId,
        floorId,
        name,
        capacity: capacity || 4,
        status: status || "AVAILABLE",
      },
      include: { floor: true },
    });

    const response: ApiResponse = {
      success: true,
      message: "Table created successfully",
      data: table,
    };

    res.status(HTTP_STATUS.CREATED).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (
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

    const existing = await prisma.table.findFirst({
      where: { id, adminId, deletedAt: null },
    });

    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Table not found",
      });
      return;
    }

    const { floorId, name, capacity, status } = req.body;

    const table = await prisma.table.update({
      where: { id },
      data: {
        floorId,
        name,
        capacity,
        status,
      },
      include: { floor: true },
    });

    const response: ApiResponse = {
      success: true,
      message: "Table updated successfully",
      data: table,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteTable = async (
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

    const existing = await prisma.table.findFirst({
      where: { id, adminId, deletedAt: null },
    });

    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Table not found",
      });
      return;
    }

    await prisma.table.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    const response: ApiResponse = {
      success: true,
      message: "Table deleted successfully",
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};
