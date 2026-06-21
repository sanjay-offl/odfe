import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/methods", authenticate, paymentController.getPaymentMethods);
router.post("/transactions", authenticate, paymentController.createTransaction);

export default router;
