import express from "express";

import {
  createPayment,
  getMyPayments,
  getMyPaymentById,
  verifyPayment,
  rejectPayment,
  refundPayment,
  getAllPayments,
  getPaymentById,
} from "../controllers/payment.controller.js";

import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// =========================
// USER ROUTES
// =========================

// User submits payment after choosing paid subscription
router.post("/create", protect, createPayment);

// User views own payments
router.get("/my-payments", protect, getMyPayments);

// User views single own payment
router.get("/my-payments/:paymentId", protect, getMyPaymentById);

// =========================
// ADMIN ROUTES
// =========================

router.get("/admin/all", protect, adminOnly, getAllPayments);
router.get("/admin/:paymentId", protect, adminOnly, getPaymentById);

router.patch("/admin/verify/:paymentId", protect, adminOnly, verifyPayment);
router.patch("/admin/reject/:paymentId", protect, adminOnly, rejectPayment);
router.patch("/admin/refund/:paymentId", protect, adminOnly, refundPayment);

export default router;