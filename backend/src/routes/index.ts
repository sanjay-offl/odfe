import { Router } from "express";
import authRoutes from "./auth.routes";
import dashboardRoutes from "./dashboard.routes";
import productRoutes from "./product.routes";
import orderRoutes from "./order.routes";
import categoryRoutes from "./category.routes";
import customerRoutes from "./customer.routes";
import tableRoutes from "./table.routes";
import floorRoutes from "./floor.routes";
import couponRoutes from "./coupon.routes";
import settingsRoutes from "./settings.routes";
import employeeRoutes from "./employee.routes";
import bookingRoutes from "./booking.routes";
import promotionRoutes from "./promotion.routes";
import paymentRoutes from "./payment.routes";
import kitchenRoutes from "./kitchen.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/categories", categoryRoutes);
router.use("/customers", customerRoutes);
router.use("/tables", tableRoutes);
router.use("/floors", floorRoutes);
router.use("/coupons", couponRoutes);
router.use("/settings", settingsRoutes);
router.use("/employees", employeeRoutes);
router.use("/bookings", bookingRoutes);
router.use("/promotions", promotionRoutes);
router.use("/payments", paymentRoutes);
router.use("/kitchen-orders", kitchenRoutes);

export default router;
