import express from "express";
import { protect, authorizeRoles } from "../middleware/auth.js";
import {
  requireActiveSubscription,
  checkNumericFeatureLimit,
} from "../middleware/subscriptionAccess.js";

import Connection from "../models/connection.model.js";

import {
  createConnectionRequest,
  getMyConnections,
  getConnectionById,
  acceptConnectionRequest,
  rejectConnectionRequest,
  cancelConnectionRequest,
  sendConnectionMessage,
  getConnectionMessages,
  markConnectionMessagesAsRead,
  getConnectionContactDetails,
  adminCreateConnection,
  adminUpdateConnection,
  adminDeleteConnection,
} from "../controllers/connection.controller.js";

const router = express.Router();

// =========================
// ADMIN CRUD ROUTES
// IMPORTANT: keep these before "/:connectionId"
// =========================

router.post(
  "/admin/create",
  protect,
  authorizeRoles("admin"),
  adminCreateConnection
);

router.patch(
  "/admin/:connectionId",
  protect,
  authorizeRoles("admin"),
  adminUpdateConnection
);

router.delete(
  "/admin/:connectionId",
  protect,
  authorizeRoles("admin"),
  adminDeleteConnection
);

// =========================
// USER / SHARED ROUTES
// =========================

// Normal post/case based connection request
router.post(
  "/request",
  protect,
  authorizeRoles("client", "lawyer"),
  requireActiveSubscription,
  checkNumericFeatureLimit("connection_request_limit", async (req) => {
    return Connection.countDocuments({
      requestedBy: req.user.id,
      sourceType: "post",
      createdAt: {
        $gte: req.subscription.startDate,
        $lte: req.subscription.endDate,
      },
    });
  }),
  createConnectionRequest
);

// My connections
// This will return both post-based and appointment-based accepted connections
router.get(
  "/my",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  getMyConnections
);

router.get(
  "/:connectionId",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  getConnectionById
);

router.patch(
  "/:connectionId/accept",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  acceptConnectionRequest
);

router.patch(
  "/:connectionId/reject",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  rejectConnectionRequest
);

router.patch(
  "/:connectionId/cancel",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  cancelConnectionRequest
);

// =========================
// SAME MESSAGING SYSTEM
// Works for both sourceType: "post" and sourceType: "booking"
// =========================

router.post(
  "/:connectionId/messages",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  requireActiveSubscription,
  sendConnectionMessage
);

router.get(
  "/:connectionId/messages",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  requireActiveSubscription,
  getConnectionMessages
);

router.patch(
  "/:connectionId/messages/read",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  requireActiveSubscription,
  markConnectionMessagesAsRead
);

router.get(
  "/:connectionId/contact",
  protect,
  authorizeRoles("client", "lawyer", "admin"),
  requireActiveSubscription,
  getConnectionContactDetails
);

export default router;