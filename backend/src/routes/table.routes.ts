import { Router } from "express";
import * as tableController from "../controllers/table.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/floors", authenticate, tableController.getFloors);
router.post("/floors", authenticate, tableController.createFloor);
router.put("/floors/:id", authenticate, tableController.updateFloor);
router.delete("/floors/:id", authenticate, tableController.deleteFloor);

router.get("/tables", authenticate, tableController.getTables);
router.post("/tables", authenticate, tableController.createTable);
router.put("/tables/:id", authenticate, tableController.updateTable);
router.delete("/tables/:id", authenticate, tableController.deleteTable);

export default router;
