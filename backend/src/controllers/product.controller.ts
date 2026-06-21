import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants";
import { ApiResponse } from "../interfaces";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();



export const getProducts = async (
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

    const products = await prisma.product.findMany({
      where: { adminId, isActive: true },
      include: { category: true, inventory: true },
      orderBy: { name: 'asc' }
    });

    const categories = await prisma.category.findMany({
      where: { adminId, isActive: true },
      orderBy: { name: 'asc' }
    });

    const response: ApiResponse = {
      success: true,
      message: "Products retrieved successfully",
      data: { categories, products },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
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

    const product = await prisma.product.findFirst({
      where: { id, adminId },
      include: { category: true, inventory: true },
    });

    if (!product) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Product not found" });
      return;
    }

    res.status(HTTP_STATUS.OK).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
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

    const { name, description, price, costPrice, taxRate, sku, barcode, image, categoryId, isActive } = req.body;

    const product = await prisma.product.create({
      data: {
        adminId,
        name,
        description,
        price: parseFloat(price),
        costPrice: costPrice ? parseFloat(costPrice) : undefined,
        taxRate: taxRate ? parseFloat(taxRate) : 5.0,
        sku,
        barcode,
        image,
        categoryId,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: { category: true },
    });

    await prisma.inventory.create({
      data: {
        adminId,
        productId: product.id,
        stock: req.body.stock ? parseInt(req.body.stock) : 100,
        minimumStock: req.body.minimumStock ? parseInt(req.body.minimumStock) : 20,
      },
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
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

    const existing = await prisma.product.findFirst({ where: { id, adminId } });
    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Product not found" });
      return;
    }

    const { name, description, price, costPrice, taxRate, sku, barcode, image, categoryId, isActive, stock, minimumStock } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : undefined,
        sku,
        barcode,
        image,
        categoryId,
        isActive,
      },
      include: { category: true, inventory: true },
    });

    if (stock !== undefined || minimumStock !== undefined) {
      const inv = await prisma.inventory.findUnique({ where: { productId: id } });
      if (inv) {
        await prisma.inventory.update({
          where: { productId: id },
          data: {
            stock: stock !== undefined ? parseInt(stock) : undefined,
            minimumStock: minimumStock !== undefined ? parseInt(minimumStock) : undefined,
          },
        });
      } else {
        await prisma.inventory.create({
          data: {
            adminId,
            productId: id,
            stock: stock ? parseInt(stock) : 100,
            minimumStock: minimumStock ? parseInt(minimumStock) : 20,
          },
        });
      }
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
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

    const existing = await prisma.product.findFirst({ where: { id, adminId } });
    if (!existing) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Product not found" });
      return;
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(HTTP_STATUS.OK).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};