import { Router } from "express";
import * as tableController from "../controllers/table.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, tableController.getFloors);
router.post("/", authenticate, tableController.createFloor);
router.put("/:id", authenticate, tableController.updateFloor);
router.delete("/:id", authenticate, tableController.deleteFloor);

export default router;
