import { Router } from "express";
import * as settingsController from "../controllers/settings.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, settingsController.getSettings);
router.put("/", authenticate, settingsController.updateSettings);

export default router;
