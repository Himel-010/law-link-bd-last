import Payment from "../models/payment.model.js";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";
import {
  calculateEndDate,
  syncUserSubscriptionStatus,
} from "../utils/subscription.utils.js";

const ALLOWED_PAYMENT_METHODS = ["bkash", "nagad"];

const isAdmin = (req) => req.user?.role === "admin";

const ensureOwnerOrAdmin = (req, ownerId) => {
  return isAdmin(req) || String(req.user?.id) === String(ownerId);
};

const normalizeMethod = (method) => {
  const value = String(method || "").toLowerCase().trim();

  if (value === "nogod") return "nagad";

  return value;
};

const getSafePagination = (page, limit) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  return {
    safePage,
    safeLimit,
    skip,
  };
};

// =========================
// USER: CREATE PAYMENT REQUEST
// =========================

export const createPayment = async (req, res) => {
  try {
    const userId = req.user?.id;

    const {
      subscriptionId,
      transactionId,
      method,
      senderNumber = null,
      note = null,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    if (!subscriptionId || !transactionId || !method) {
      return res.status(400).json({
        success: false,
        message: "subscriptionId, transactionId and method are required",
      });
    }

    const normalizedMethod = normalizeMethod(method);

    if (!ALLOWED_PAYMENT_METHODS.includes(normalizedMethod)) {
      return res.status(400).json({
        success: false,
        message: "Payment method must be either bkash or nagad",
      });
    }

    const finalTransactionId = String(transactionId || "").trim();

    if (!finalTransactionId) {
      return res.status(400).json({
        success: false,
        message: "transactionId is required",
      });
    }

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (!ensureOwnerOrAdmin(req, subscription.user)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    if (Number(subscription.price || 0) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Free subscription does not require payment",
      });
    }

    if (subscription.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled subscription cannot be paid",
      });
    }

    if (subscription.status === "expired") {
      return res.status(400).json({
        success: false,
        message: "Expired subscription cannot be paid",
      });
    }

    if (
      subscription.status === "active" &&
      subscription.payment?.status === "paid"
    ) {
      return res.status(400).json({
        success: false,
        message: "This subscription is already paid and active",
      });
    }

    const existingTx = await Payment.findOne({
      transactionId: finalTransactionId,
    });

    if (existingTx) {
      return res.status(409).json({
        success: false,
        message: "Transaction ID already used",
      });
    }

    const existingPendingPayment = await Payment.findOne({
      subscription: subscription._id,
      paymentStatus: "pending",
    });

    if (existingPendingPayment) {
      return res.status(400).json({
        success: false,
        message: "A pending payment already exists for this subscription",
        data: existingPendingPayment,
      });
    }

    const existingVerifiedPayment = await Payment.findOne({
      subscription: subscription._id,
      paymentStatus: "verified",
    });

    if (existingVerifiedPayment) {
      return res.status(400).json({
        success: false,
        message: "This subscription already has a verified payment",
      });
    }

    const payment = await Payment.create({
      user: subscription.user,
      subscription: subscription._id,
      plan: subscription.plan,
      roleType: subscription.roleType,
      planName: subscription.planName,
      planSlug: subscription.planSlug,
      amount: subscription.price,
      currency: subscription.currency,
      method: normalizedMethod,
      transactionId: finalTransactionId,
      senderNumber,
      paymentStatus: "pending",
      note,
    });

    subscription.payment.status = "unpaid";
    subscription.payment.transactionId = finalTransactionId;
    subscription.payment.method = normalizedMethod;
    subscription.payment.paidAt = null;

    if (subscription.status !== "active") {
      subscription.status = "pending";
      subscription.startDate = null;
      subscription.endDate = null;
      subscription.activatedAt = null;
      subscription.cancelledAt = null;
    }

    await subscription.save();

    await syncUserSubscriptionStatus(subscription.user, {
      autoAssignFree: true,
    });

    return res.status(201).json({
      success: true,
      message: "Payment request created successfully. Waiting for admin verification",
      data: payment,
    });
  } catch (error) {
    console.error("createPayment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment request",
      error: error.message,
    });
  }
};

// =========================
// USER: GET OWN PAYMENTS
// =========================

export const getMyPayments = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { paymentStatus, page = 1, limit = 10 } = req.query;

    const filter = {
      user: userId,
    };

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    const { safePage, safeLimit, skip } = getSafePagination(page, limit);

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("plan")
        .populate(
          "subscription",
          "planName planSlug roleType price currency status startDate endDate payment"
        )
        .populate("verifiedBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      Payment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: safePage,
      limit: safeLimit,
      data: payments,
    });
  } catch (error) {
    console.error("getMyPayments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
      error: error.message,
    });
  }
};

// =========================
// USER: GET OWN PAYMENT BY ID
// =========================

export const getMyPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate("plan")
      .populate(
        "subscription",
        "planName planSlug roleType price currency status startDate endDate payment"
      )
      .populate("verifiedBy", "name email role");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (!ensureOwnerOrAdmin(req, payment.user)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("getMyPaymentById error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: VERIFY PAYMENT
// =========================

export const verifyPayment = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only admin can verify payment",
      });
    }

    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.paymentStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending payment can be verified. Current status: ${payment.paymentStatus}`,
      });
    }

    const subscription = await Subscription.findById(payment.subscription);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Related subscription not found",
      });
    }

    if (subscription.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled subscription cannot be activated",
      });
    }

    if (subscription.status === "expired") {
      return res.status(400).json({
        success: false,
        message: "Expired subscription cannot be activated",
      });
    }

    const now = new Date();
    const normalizedMethod = normalizeMethod(payment.method);

    if (!ALLOWED_PAYMENT_METHODS.includes(normalizedMethod)) {
      return res.status(400).json({
        success: false,
        message: "Payment method must be either bkash or nagad",
      });
    }

    payment.method = normalizedMethod;
    payment.paymentStatus = "verified";
    payment.verifiedAt = now;
    payment.rejectedAt = null;
    payment.refundedAt = null;
    payment.verifiedBy = req.user?.id || null;
    payment.rejectionReason = null;
    payment.refundReason = null;

    await payment.save();

    subscription.status = "active";
    subscription.activatedAt = subscription.activatedAt || now;
    subscription.startDate = now;
    subscription.endDate = calculateEndDate(now, subscription.durationInDays);
    subscription.cancelledAt = null;

    subscription.payment.status = "paid";
    subscription.payment.transactionId = payment.transactionId;
    subscription.payment.method = normalizedMethod;
    subscription.payment.paidAt = now;

    await subscription.save();

    await syncUserSubscriptionStatus(subscription.user, {
      autoAssignFree: true,
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified and subscription activated successfully",
      data: {
        payment,
        subscription,
      },
    });
  } catch (error) {
    console.error("verifyPayment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: REJECT PAYMENT
// =========================

export const rejectPayment = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only admin can reject payment",
      });
    }

    const { paymentId } = req.params;
    const { rejectionReason = null } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.paymentStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending payment can be rejected. Current status: ${payment.paymentStatus}`,
      });
    }

    const subscription = await Subscription.findById(payment.subscription);

    payment.paymentStatus = "rejected";
    payment.rejectedAt = new Date();
    payment.rejectionReason = rejectionReason;
    payment.verifiedBy = req.user?.id || null;
    payment.verifiedAt = null;
    payment.refundedAt = null;
    payment.refundReason = null;

    await payment.save();

    if (subscription) {
      subscription.payment.status = "failed";
      subscription.payment.paidAt = null;

      if (subscription.status !== "active") {
        subscription.status = "pending";
        subscription.startDate = null;
        subscription.endDate = null;
        subscription.activatedAt = null;
      }

      await subscription.save();

      await syncUserSubscriptionStatus(subscription.user, {
        autoAssignFree: true,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment rejected successfully",
      data: payment,
    });
  } catch (error) {
    console.error("rejectPayment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject payment",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: REFUND PAYMENT
// =========================

export const refundPayment = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only admin can refund payment",
      });
    }

    const { paymentId } = req.params;
    const { refundReason = null } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.paymentStatus !== "verified") {
      return res.status(400).json({
        success: false,
        message: "Only verified payment can be refunded",
      });
    }

    const subscription = await Subscription.findById(payment.subscription);

    const now = new Date();

    payment.paymentStatus = "refunded";
    payment.refundedAt = now;
    payment.refundReason = refundReason;
    payment.verifiedBy = req.user?.id || null;

    await payment.save();

    if (subscription) {
      subscription.payment.status = "refunded";
      subscription.payment.paidAt = null;
      subscription.status = "cancelled";
      subscription.cancelledAt = now;

      await subscription.save();

      await syncUserSubscriptionStatus(subscription.user, {
        autoAssignFree: true,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment refunded successfully",
      data: payment,
    });
  } catch (error) {
    console.error("refundPayment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to refund payment",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: GET ALL PAYMENTS
// =========================

export const getAllPayments = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only admin can view all payments",
      });
    }

    const {
      paymentStatus,
      method,
      roleType,
      planSlug,
      userId,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (method) {
      const normalizedMethod = normalizeMethod(method);

      if (!ALLOWED_PAYMENT_METHODS.includes(normalizedMethod)) {
        return res.status(400).json({
          success: false,
          message: "method must be either bkash or nagad",
        });
      }

      filter.method = normalizedMethod;
    }

    if (roleType) {
      if (!["client", "lawyer"].includes(roleType)) {
        return res.status(400).json({
          success: false,
          message: "roleType must be either client or lawyer",
        });
      }

      filter.roleType = roleType;
    }

    if (planSlug) filter.planSlug = String(planSlug).toLowerCase();
    if (userId) filter.user = userId;

    const { safePage, safeLimit, skip } = getSafePagination(page, limit);

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("user", "name email role phone subscriptionStatus currentSubscription")
        .populate("plan")
        .populate(
          "subscription",
          "planName planSlug roleType price currency status startDate endDate payment"
        )
        .populate("verifiedBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      Payment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: safePage,
      limit: safeLimit,
      data: payments,
    });
  } catch (error) {
    console.error("getAllPayments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: GET PAYMENT BY ID
// =========================

export const getPaymentById = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only admin can view payment details",
      });
    }

    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate("user", "name email role phone subscriptionStatus currentSubscription")
      .populate("plan")
      .populate("subscription")
      .populate("verifiedBy", "name email role");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("getPaymentById error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message,
    });
  }
};