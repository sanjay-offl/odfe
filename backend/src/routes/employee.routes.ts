import { Router } from "express";
import * as employeeController from "../controllers/employee.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, employeeController.getEmployees);
router.get("/:id", authenticate, employeeController.getEmployeeById);
router.post("/", authenticate, employeeController.createEmployee);
router.put("/:id", authenticate, employeeController.updateEmployee);
router.delete("/:id", authenticate, employeeController.deleteEmployee);

export default router;
