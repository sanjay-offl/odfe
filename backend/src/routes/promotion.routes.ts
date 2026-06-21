import { Router } from "express";
import * as promotionController from "../controllers/promotion.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, promotionController.getPromotions);
router.post("/", authenticate, promotionController.createPromotion);
router.put("/:id", authenticate, promotionController.updatePromotion);
router.delete("/:id", authenticate, promotionController.deletePromotion);

export default router;
