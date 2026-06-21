import { Router } from "express";
import * as customerController from "../controllers/customer.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, customerController.getCustomers);
router.get("/:id", authenticate, customerController.getCustomerById);
router.post("/", authenticate, customerController.createCustomer);
router.put("/:id", authenticate, customerController.updateCustomer);
router.delete("/:id", authenticate, customerController.deleteCustomer);

export default router;
