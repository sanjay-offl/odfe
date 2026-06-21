import { Router } from "express";
import * as tableController from "../controllers/table.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, tableController.getTables);
router.post("/", authenticate, tableController.createTable);
router.put("/:id", authenticate, tableController.updateTable);
router.delete("/:id", authenticate, tableController.deleteTable);

export default router;
