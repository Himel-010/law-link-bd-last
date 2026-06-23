import express from "express";
import { protect, authorizeRoles } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscriptionAccess.js";

import {
  upsertMyAvailability,
  getMyAvailability,
  getLawyerAvailability,
  deleteMyAvailabilityDate,
  blockMyAvailabilitySlot,
  blockMyAvailabilityDate,
  blockMyAvailabilityRange,
} from "../controllers/lawyerAvailability.controller.js";

const router = express.Router();

// =========================
// LAWYER ROUTES
// =========================

router.post(
  "/my",
  protect,
  authorizeRoles("lawyer"),
  requireActiveSubscription,
  upsertMyAvailability
);

router.get(
  "/my",
  protect,
  authorizeRoles("lawyer"),
  requireActiveSubscription,
  getMyAvailability
);

router.patch(
  "/my/:availabilityId/block-slot",
  protect,
  authorizeRoles("lawyer"),
  requireActiveSubscription,
  blockMyAvailabilitySlot
);

router.patch(
  "/my/:availabilityId/block-day",
  protect,
  authorizeRoles("lawyer"),
  requireActiveSubscription,
  blockMyAvailabilityDate
);

router.patch(
  "/my/block-range",
  protect,
  authorizeRoles("lawyer"),
  requireActiveSubscription,
  blockMyAvailabilityRange
);

router.delete(
  "/my/:availabilityId",
  protect,
  authorizeRoles("lawyer"),
  requireActiveSubscription,
  deleteMyAvailabilityDate
);

// =========================
// PUBLIC / CLIENT / ADMIN ROUTES
// =========================

router.get(
  "/lawyer/:lawyerId",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  getLawyerAvailability
);

export default router;