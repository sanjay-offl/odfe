import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, productController.getProducts);
router.get("/:id", authenticate, productController.getProductById);
router.post("/", authenticate, authorizeAdmin, productController.createProduct);
router.put("/:id", authenticate, authorizeAdmin, productController.updateProduct);
router.delete("/:id", authenticate, authorizeAdmin, productController.deleteProduct);

export default router;