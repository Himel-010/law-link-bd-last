import express from "express";
import { protect, authorizeRoles } from "../middleware/auth.js";
import {
  requireActiveSubscription,
  checkNumericFeatureLimit,
} from "../middleware/subscriptionAccess.js";

import ConsultationBooking from "../models/consultationBooking.model.js";

import {
  createConsultationBooking,
  getMyConsultationBookings,
  getConsultationBookingById,
  acceptConsultationBooking,
  rejectConsultationBooking,
  cancelConsultationBooking,
  completeConsultationBooking,
  adminDeleteConsultationBooking,
  returnExistingBookingIfSameClient,
} from "../controllers/consultationBooking.controller.js";

const router = express.Router();

// =========================
// CLIENT: AUTO-ACCEPTED BOOKING
// =========================

router.post(
  "/request",
  protect,
  authorizeRoles("client"),

  // IMPORTANT:
  // This must run before subscription limit.
  // If the same client already booked the same slot, return success instead of error.
  returnExistingBookingIfSameClient,

  requireActiveSubscription,
  checkNumericFeatureLimit("booking_request_limit", async (req) => {
    return ConsultationBooking.countDocuments({
      requestedBy: req.user.id,
      createdAt: {
        $gte: req.subscription.startDate,
        $lte: req.subscription.endDate,
      },
    });
  }),
  createConsultationBooking
);

// =========================
// READ BOOKINGS
// =========================

router.get(
  "/my",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  getMyConsultationBookings
);

router.get(
  "/:bookingId",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  getConsultationBookingById
);

// =========================
// LEGACY PENDING BOOKING SUPPORT
// =========================

router.patch(
  "/:bookingId/accept",
  protect,
  authorizeRoles("lawyer", "admin"),
  acceptConsultationBooking
);

router.patch(
  "/:bookingId/reject",
  protect,
  authorizeRoles("lawyer", "admin"),
  rejectConsultationBooking
);

// =========================
// SHARED ACTIONS
// =========================

router.patch(
  "/:bookingId/cancel",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  cancelConsultationBooking
);

router.patch(
  "/:bookingId/complete",
  protect,
  authorizeRoles("lawyer", "admin"),
  completeConsultationBooking
);

// =========================
// ADMIN
// =========================

router.delete(
  "/admin/:bookingId",
  protect,
  authorizeRoles("admin"),
  adminDeleteConsultationBooking
);

export default router;