import { Router } from "express";
import * as kitchenController from "../controllers/kitchen.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, kitchenController.getKitchenOrders);
router.put("/:id/status", authenticate, kitchenController.updateKitchenOrderStatus);

export default router;
