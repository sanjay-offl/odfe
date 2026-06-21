import { Router } from "express";
import * as bookingController from "../controllers/booking.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, bookingController.getBookings);
router.post("/", authenticate, bookingController.createBooking);
router.put("/:id", authenticate, bookingController.updateBooking);
router.delete("/:id", authenticate, bookingController.deleteBooking);

export default router;
