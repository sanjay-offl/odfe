import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants";
import { ApiResponse } from "../interfaces";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
function getSupabaseAdmin() {
  if (!supabaseServiceRoleKey) return null;
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export const getEmployees = async (
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

    const employees = await prisma.employee.findMany({
      where: { adminId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    const response: ApiResponse = {
      success: true,
      message: "Employees retrieved successfully",
      data: employees,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (
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

    const employee = await prisma.employee.findFirst({
      where: { id, adminId, deletedAt: null },
      include: { user: { select: { email: true, isActive: true } } },
    });

    if (!employee) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Employee not found",
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: "Employee retrieved successfully",
      data: employee,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (
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
      name,
      email,
      employeeNo,
      position,
      shift,
      hourlyRate,
      hireDate,
      status,
    } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: "A user with this email already exists",
      });
      return;
    }

    const supabaseAdmin = getSupabaseAdmin();
    let authUserId: string;
    if (supabaseAdmin) {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: "changeme123",
        email_confirm: true,
        user_metadata: { name, role: "EMPLOYEE" },
      });
      if (authError || !authUser.user) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Failed to create auth user: " + (authError?.message || "Unknown error"),
        });
        return;
      }
      authUserId = authUser.user.id;
    } else {
      authUserId = crypto.randomUUID();
    }

    const newUser = await prisma.user.create({
      data: {
        id: authUserId,
        email,
        name,
        role: "EMPLOYEE",
        plan: "FREE",
        isActive: true,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        userId: newUser.id,
        adminId,
        name,
        email,
        employeeNo,
        position,
        shift,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        hireDate: hireDate ? new Date(hireDate) : undefined,
        status: status || "Active",
      },
    });

    const response: ApiResponse = {
      success: true,
      message: "Employee created successfully",
      data: employee,
    };

    res.status(HTTP_STATUS.CREATED).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (
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

    const existing = await prisma.employee.findFirst({
      where: { id, adminId, deletedAt: null },
    });

    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Employee not found",
      });
      return;
    }

    const {
      name,
      email,
      employeeNo,
      position,
      shift,
      hourlyRate,
      hireDate,
      status,
    } = req.body;

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        email,
        employeeNo,
        position,
        shift,
        hourlyRate: hourlyRate !== undefined ? parseFloat(hourlyRate) : undefined,
        hireDate: hireDate ? new Date(hireDate) : undefined,
        status,
      },
    });

    if (name) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { name },
      });
    }

    const response: ApiResponse = {
      success: true,
      message: "Employee updated successfully",
      data: employee,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (
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

    const existing = await prisma.employee.findFirst({
      where: { id, adminId, deletedAt: null },
    });

    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Employee not found",
      });
      return;
    }

    await prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: existing.userId },
      data: { isActive: false },
    });

    const response: ApiResponse = {
      success: true,
      message: "Employee deleted successfully",
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
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

    const employee = await prisma.employee.findFirst({
      where: { id, adminId, deletedAt: null },
    });

    if (!employee) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Employee not found",
      });
      return;
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      res.status(501).json({
        success: false,
        message: "Supabase service role key not configured. Cannot reset password.",
      });
      return;
    }

    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: employee.email,
    });

    if (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to generate reset link: " + error.message,
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: "Password reset link sent to " + employee.email,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};
