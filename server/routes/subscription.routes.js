import express from "express";

import {
  choosePlan,
  getMySubscription,
  getMySubscriptionHistory,
  cancelMySubscription,
  adminCreateSubscription,
  getAllSubscriptionsAdmin,
  getSubscriptionByIdAdmin,
  updateSubscriptionAdmin,
  deleteSubscriptionAdmin,
  markExpiredSubscriptions,
  refreshSubscriptionFeaturesAdmin,
} from "../controllers/subscription.controller.js";

import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// =========================
// USER ROUTES
// =========================

router.post("/choose-plan", protect, choosePlan);
router.get("/my/current", protect, getMySubscription);
router.get("/my/history", protect, getMySubscriptionHistory);
router.patch("/my/cancel/:subscriptionId", protect, cancelMySubscription);

// =========================
// ADMIN ROUTES
// =========================

router.post(
  "/admin/create",
  protect,
  authorizeRoles("admin"),
  adminCreateSubscription
);

router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  getAllSubscriptionsAdmin
);

router.patch(
  "/admin/mark-expired/run",
  protect,
  authorizeRoles("admin"),
  markExpiredSubscriptions
);

router.patch(
  "/admin/:subscriptionId/refresh-features",
  protect,
  authorizeRoles("admin"),
  refreshSubscriptionFeaturesAdmin
);

router.get(
  "/admin/:subscriptionId",
  protect,
  authorizeRoles("admin"),
  getSubscriptionByIdAdmin
);

router.patch(
  "/admin/:subscriptionId",
  protect,
  authorizeRoles("admin"),
  updateSubscriptionAdmin
);

router.delete(
  "/admin/:subscriptionId",
  protect,
  authorizeRoles("admin"),
  deleteSubscriptionAdmin
);

export default router;