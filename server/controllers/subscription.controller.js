import Plan from "../models/plan.model.js";
import Payment from "../models/payment.model.js";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";
import {
  calculateEndDate,
  convertFeaturesArrayToObject,
  syncUserSubscriptionStatus,
  expireOldSubscriptions,
  getActiveSubscription,
} from "../utils/subscription.utils.js";

const ALLOWED_PAYMENT_METHODS = ["bkash", "nagad", "nogod"];

const getUserRoleType = (userRole) => {
  if (userRole === "client") return "client";
  if (userRole === "lawyer") return "lawyer";
  return null;
};

const normalizeMethod = (method) => {
  const value = String(method || "").toLowerCase().trim();

  if (value === "nogod") return "nagad";

  return value;
};

const isValidSubscriptionStatus = (status) => {
  return ["pending", "active", "expired", "cancelled"].includes(status);
};

const isValidPaymentStatus = (status) => {
  return ["free", "unpaid", "paid", "failed", "refunded"].includes(status);
};

const getPopulatedSubscription = async (subscriptionId) => {
  return Subscription.findById(subscriptionId)
    .populate("user", "name email role phone subscriptionStatus currentSubscription")
    .populate("plan");
};

const getActiveSamePlanSubscription = async ({
  userId,
  planId,
  excludeSubscriptionId = null,
}) => {
  const filter = {
    user: userId,
    plan: planId,
    status: "active",
    startDate: { $lte: new Date() },
    endDate: { $gt: new Date() },
  };

  if (excludeSubscriptionId) {
    filter._id = { $ne: excludeSubscriptionId };
  }

  return Subscription.findOne(filter);
};

const getAnyActiveSubscription = async ({ userId, excludeSubscriptionId = null }) => {
  const filter = {
    user: userId,
    status: "active",
    startDate: { $lte: new Date() },
    endDate: { $gt: new Date() },
  };

  if (excludeSubscriptionId) {
    filter._id = { $ne: excludeSubscriptionId };
  }

  return Subscription.findOne(filter).sort({ endDate: -1, createdAt: -1 });
};

const cancelOtherActiveSubscriptions = async ({ userId, keepSubscriptionId }) => {
  if (!userId || !keepSubscriptionId) return null;

  return Subscription.updateMany(
    {
      user: userId,
      status: "active",
      _id: { $ne: keepSubscriptionId },
    },
    {
      $set: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    }
  );
};

const createOrUpdatePaymentRecord = async ({
  subscription,
  user,
  plan,
  method,
  transactionId,
  paymentStatus,
  adminId = null,
  note = null,
}) => {
  if (!subscription || !user || !plan || !method || !transactionId) {
    return null;
  }

  const now = new Date();
  const isVerified = paymentStatus === "paid";

  return Payment.findOneAndUpdate(
    { subscription: subscription._id },
    {
      user: user._id,
      subscription: subscription._id,
      plan: plan._id,
      roleType: plan.roleType,
      planName: plan.name,
      planSlug: plan.slug,
      amount: plan.price,
      currency: plan.currency,
      method,
      transactionId,
      senderNumber: null,
      paymentStatus: isVerified ? "verified" : "pending",
      verifiedAt: isVerified ? now : null,
      verifiedBy: isVerified ? adminId : null,
      note,
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );
};

// =========================
// USER: CHOOSE / PURCHASE PLAN
// =========================

export const choosePlan = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { planId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "planId is required",
      });
    }

    const roleType = getUserRoleType(userRole);

    if (!roleType) {
      return res.status(403).json({
        success: false,
        message: "Only client or lawyer can purchase a plan",
      });
    }

    const plan = await Plan.findOne({
      _id: planId,
      roleType,
      isActive: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found for your role",
      });
    }

    const existingActiveSamePlan = await getActiveSamePlanSubscription({
      userId,
      planId: plan._id,
    });

    if (existingActiveSamePlan) {
      return res.status(409).json({
        success: false,
        message: "You already have this plan active.",
        data: existingActiveSamePlan,
      });
    }

    const isFreePlan = Number(plan.price) === 0;

    if (isFreePlan) {
      const existingActiveAnyPlan = await getAnyActiveSubscription({ userId });

      if (existingActiveAnyPlan) {
        return res.status(409).json({
          success: false,
          message:
            "You already have an active subscription. You cannot downgrade to the free plan while another plan is active.",
          data: existingActiveAnyPlan,
        });
      }
    }

    const existingPendingSubscription = await Subscription.findOne({
      user: userId,
      status: "pending",
      plan: plan._id,
    });

    if (existingPendingSubscription && Number(plan.price) > 0) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending subscription for this plan. Please submit payment or wait for admin verification.",
        data: existingPendingSubscription,
        nextStep: {
          paymentRequired: true,
          subscriptionId: existingPendingSubscription._id,
          amount: existingPendingSubscription.price,
          currency: existingPendingSubscription.currency,
          createPaymentEndpoint: "/api/payments/create",
        },
      });
    }

    const now = new Date();

    const subscription = await Subscription.create({
      user: userId,
      plan: plan._id,
      roleType: plan.roleType,
      planName: plan.name,
      planSlug: plan.slug,
      price: Number(plan.price),
      currency: plan.currency,
      durationInDays: Number(plan.durationInDays),

      features: convertFeaturesArrayToObject(plan.features),

      status: isFreePlan ? "active" : "pending",
      startDate: isFreePlan ? now : null,
      endDate: isFreePlan ? calculateEndDate(now, plan.durationInDays) : null,
      activatedAt: isFreePlan ? now : null,
      cancelledAt: null,

      payment: {
        status: isFreePlan ? "free" : "unpaid",
        transactionId: null,
        method: null,
        paidAt: null,
      },
    });

    if (subscription.status === "active") {
      await cancelOtherActiveSubscriptions({
        userId,
        keepSubscriptionId: subscription._id,
      });
    }

    await syncUserSubscriptionStatus(userId, { autoAssignFree: true });

    return res.status(201).json({
      success: true,
      message: isFreePlan
        ? "Free plan activated successfully"
        : "Subscription created successfully. Please submit payment for admin verification.",
      data: subscription,
      nextStep: isFreePlan
        ? null
        : {
            paymentRequired: true,
            subscriptionId: subscription._id,
            amount: subscription.price,
            currency: subscription.currency,
            createPaymentEndpoint: "/api/payments/create",
          },
    });
  } catch (error) {
    console.error("choosePlan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to choose plan",
      error: error.message,
    });
  }
};

// =========================
// USER: CURRENT SUBSCRIPTION
// =========================

export const getMySubscription = async (req, res) => {
  try {
    const userId = req.user?.id;

    const subscription = await getActiveSubscription(userId, {
      autoAssignFree: true,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("getMySubscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription",
      error: error.message,
    });
  }
};

// =========================
// USER: SUBSCRIPTION HISTORY
// =========================

export const getMySubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {
      user: userId,
    };

    if (status) {
      filter.status = status;
    }

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate("plan")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      Subscription.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: safePage,
      limit: safeLimit,
      data: subscriptions,
    });
  } catch (error) {
    console.error("getMySubscriptionHistory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription history",
      error: error.message,
    });
  }
};

// =========================
// USER: CANCEL OWN SUBSCRIPTION
// =========================

export const cancelMySubscription = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      user: userId,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (!["active", "pending"].includes(subscription.status)) {
      return res.status(400).json({
        success: false,
        message: `Subscription cannot be cancelled. Current status: ${subscription.status}`,
      });
    }

    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();

    await subscription.save();

    const fallbackSubscription = await syncUserSubscriptionStatus(userId, {
      autoAssignFree: true,
    });

    return res.status(200).json({
      success: true,
      message:
        "Subscription cancelled successfully. Default free plan is active if no other active plan exists.",
      data: subscription,
      fallbackSubscription,
    });
  } catch (error) {
    console.error("cancelMySubscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: CREATE SUBSCRIPTION MANUALLY
// =========================

export const adminCreateSubscription = async (req, res) => {
  try {
    const {
      userId,
      planId,
      startDate,
      status,
      paymentStatus,
      paymentMethod,
      transactionId,
      notes,
    } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({
        success: false,
        message: "userId and planId are required",
      });
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    if (!["client", "lawyer"].includes(targetUser.role)) {
      return res.status(400).json({
        success: false,
        message: "Target user must be client or lawyer",
      });
    }

    const plan = await Plan.findOne({
      _id: planId,
      roleType: targetUser.role,
      isActive: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Active plan not found for this user's role",
      });
    }

    const existingActiveSamePlan = await getActiveSamePlanSubscription({
      userId: targetUser._id,
      planId: plan._id,
    });

    if (existingActiveSamePlan) {
      return res.status(409).json({
        success: false,
        message: "This user already has this plan active.",
        data: existingActiveSamePlan,
      });
    }

    const existingPendingSamePlan = await Subscription.findOne({
      user: targetUser._id,
      plan: plan._id,
      status: "pending",
    });

    if (existingPendingSamePlan) {
      return res.status(409).json({
        success: false,
        message: "This user already has a pending subscription for this plan.",
        data: existingPendingSamePlan,
      });
    }

    const isFreePlan = Number(plan.price) === 0;

    let finalStatus = status || (isFreePlan ? "active" : "pending");
    let finalPaymentStatus = paymentStatus || (isFreePlan ? "free" : "unpaid");

    if (isFreePlan) {
      finalPaymentStatus = "free";
    }

    if (!isValidSubscriptionStatus(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription status",
      });
    }

    if (!isValidPaymentStatus(finalPaymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    if (!isFreePlan && finalStatus === "active") {
      finalPaymentStatus = "paid";
    }

    const needsPaymentInfo =
      !isFreePlan && (finalStatus === "active" || finalPaymentStatus === "paid");

    const normalizedMethod = normalizeMethod(paymentMethod);
    const finalTransactionId = String(transactionId || "").trim();

    if (needsPaymentInfo && !normalizedMethod) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod is required for paid or active subscription",
      });
    }

    if (normalizedMethod && !ALLOWED_PAYMENT_METHODS.includes(normalizedMethod)) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod must be either bkash or nagad",
      });
    }

    if (needsPaymentInfo && !finalTransactionId) {
      return res.status(400).json({
        success: false,
        message: "transactionId is required for paid or active subscription",
      });
    }

    if (finalTransactionId) {
      const existingTx = await Payment.findOne({
        transactionId: finalTransactionId,
      });

      if (existingTx) {
        return res.status(409).json({
          success: false,
          message: "Transaction ID already used",
        });
      }
    }

    const now = new Date();

    const finalStartDate =
      finalStatus === "active"
        ? new Date(startDate || now)
        : startDate
        ? new Date(startDate)
        : null;

    const finalEndDate =
      finalStatus === "active"
        ? calculateEndDate(finalStartDate, plan.durationInDays)
        : null;

    const subscription = await Subscription.create({
      user: targetUser._id,
      plan: plan._id,
      roleType: plan.roleType,
      planName: plan.name,
      planSlug: plan.slug,
      price: Number(plan.price),
      currency: plan.currency,
      durationInDays: Number(plan.durationInDays),

      features: convertFeaturesArrayToObject(plan.features),

      status: finalStatus,
      startDate: finalStartDate,
      endDate: finalEndDate,
      activatedAt: finalStatus === "active" ? now : null,
      cancelledAt: finalStatus === "cancelled" ? now : null,

      payment: {
        status: finalPaymentStatus,
        transactionId: finalTransactionId || null,
        method: normalizedMethod || null,
        paidAt: finalPaymentStatus === "paid" ? now : null,
      },

      adminNotes: notes || "",
    });

    if (subscription.status === "active") {
      await cancelOtherActiveSubscriptions({
        userId: targetUser._id,
        keepSubscriptionId: subscription._id,
      });
    }

    let payment = null;

    if (!isFreePlan && finalTransactionId && normalizedMethod) {
      payment = await createOrUpdatePaymentRecord({
        subscription,
        user: targetUser,
        plan,
        method: normalizedMethod,
        transactionId: finalTransactionId,
        paymentStatus: finalPaymentStatus,
        adminId: finalPaymentStatus === "paid" ? req.user?.id || null : null,
        note: notes || null,
      });
    }

    await syncUserSubscriptionStatus(targetUser._id, {
      autoAssignFree: true,
    });

    const populatedSubscription = await getPopulatedSubscription(subscription._id);

    return res.status(201).json({
      success: true,
      message: "Subscription created successfully by admin",
      data: populatedSubscription,
      payment,
    });
  } catch (error) {
    console.error("adminCreateSubscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create subscription",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: GET ALL SUBSCRIPTIONS
// =========================

export const getAllSubscriptionsAdmin = async (req, res) => {
  try {
    const {
      status,
      roleType,
      planSlug,
      userId,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (roleType) filter.roleType = roleType;
    if (planSlug) filter.planSlug = String(planSlug).toLowerCase();
    if (userId) filter.user = userId;

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate("user", "name email role phone subscriptionStatus currentSubscription")
        .populate("plan")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      Subscription.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: safePage,
      limit: safeLimit,
      data: subscriptions,
    });
  } catch (error) {
    console.error("getAllSubscriptionsAdmin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscriptions",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: GET SUBSCRIPTION BY ID
// =========================

export const getSubscriptionByIdAdmin = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await getPopulatedSubscription(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("getSubscriptionByIdAdmin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: UPDATE SUBSCRIPTION
// =========================

export const updateSubscriptionAdmin = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const {
      planId,
      startDate,
      status,
      paymentStatus,
      paymentMethod,
      transactionId,
      notes,
    } = req.body;

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    const targetUser = await User.findById(subscription.user);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Subscription user not found",
      });
    }

    if (!["client", "lawyer"].includes(targetUser.role)) {
      return res.status(400).json({
        success: false,
        message: "Subscription user must be client or lawyer",
      });
    }

    const selectedPlan = planId
      ? await Plan.findOne({
          _id: planId,
          roleType: targetUser.role,
          isActive: true,
        })
      : await Plan.findById(subscription.plan);

    if (!selectedPlan) {
      return res.status(404).json({
        success: false,
        message: "Active plan not found for this user's role",
      });
    }

    const isFreePlan = Number(selectedPlan.price) === 0;

    let finalStatus = status || subscription.status;
    let finalPaymentStatus = paymentStatus || subscription.payment?.status;

    if (isFreePlan) {
      finalPaymentStatus = "free";
    }

    if (!isValidSubscriptionStatus(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription status",
      });
    }

    if (!isValidPaymentStatus(finalPaymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    if (!isFreePlan && finalStatus === "active") {
      finalPaymentStatus = "paid";
    }

    if (finalStatus === "active") {
      const existingActiveSamePlan = await getActiveSamePlanSubscription({
        userId: targetUser._id,
        planId: selectedPlan._id,
        excludeSubscriptionId: subscription._id,
      });

      if (existingActiveSamePlan) {
        return res.status(409).json({
          success: false,
          message: "This user already has this plan active.",
          data: existingActiveSamePlan,
        });
      }
    }

    const normalizedMethod =
      paymentMethod !== undefined
        ? normalizeMethod(paymentMethod)
        : normalizeMethod(subscription.payment?.method);

    const finalTransactionId =
      transactionId !== undefined
        ? String(transactionId || "").trim()
        : String(subscription.payment?.transactionId || "").trim();

    const needsPaymentInfo =
      !isFreePlan && (finalStatus === "active" || finalPaymentStatus === "paid");

    if (needsPaymentInfo && !normalizedMethod) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod is required for paid or active subscription",
      });
    }

    if (normalizedMethod && !ALLOWED_PAYMENT_METHODS.includes(normalizedMethod)) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod must be either bkash or nagad",
      });
    }

    if (needsPaymentInfo && !finalTransactionId) {
      return res.status(400).json({
        success: false,
        message: "transactionId is required for paid or active subscription",
      });
    }

    if (finalTransactionId) {
      const existingTx = await Payment.findOne({
        transactionId: finalTransactionId,
        subscription: { $ne: subscription._id },
      });

      if (existingTx) {
        return res.status(409).json({
          success: false,
          message: "Transaction ID already used",
        });
      }
    }

    const now = new Date();

    const finalStartDate =
      finalStatus === "active"
        ? new Date(startDate || subscription.startDate || now)
        : startDate
        ? new Date(startDate)
        : null;

    const finalEndDate =
      finalStatus === "active"
        ? calculateEndDate(finalStartDate, selectedPlan.durationInDays)
        : null;

    subscription.plan = selectedPlan._id;
    subscription.roleType = selectedPlan.roleType;
    subscription.planName = selectedPlan.name;
    subscription.planSlug = selectedPlan.slug;
    subscription.price = Number(selectedPlan.price);
    subscription.currency = selectedPlan.currency;
    subscription.durationInDays = Number(selectedPlan.durationInDays);

    subscription.features = convertFeaturesArrayToObject(selectedPlan.features);

    subscription.status = finalStatus;
    subscription.startDate = finalStartDate;
    subscription.endDate = finalEndDate;

    subscription.activatedAt =
      finalStatus === "active" ? subscription.activatedAt || now : null;

    subscription.cancelledAt =
      finalStatus === "cancelled" ? subscription.cancelledAt || now : null;

    subscription.payment = {
      status: finalPaymentStatus,
      transactionId: finalTransactionId || null,
      method: normalizedMethod || null,
      paidAt:
        finalPaymentStatus === "paid"
          ? subscription.payment?.paidAt || now
          : null,
    };

    if (notes !== undefined) {
      subscription.adminNotes = notes || "";
    }

    await subscription.save();

    if (subscription.status === "active") {
      await cancelOtherActiveSubscriptions({
        userId: targetUser._id,
        keepSubscriptionId: subscription._id,
      });
    }

    if (!isFreePlan && finalTransactionId && normalizedMethod) {
      await createOrUpdatePaymentRecord({
        subscription,
        user: targetUser,
        plan: selectedPlan,
        method: normalizedMethod,
        transactionId: finalTransactionId,
        paymentStatus: finalPaymentStatus,
        adminId: finalPaymentStatus === "paid" ? req.user?.id || null : null,
        note: notes || null,
      });
    }

    if (isFreePlan) {
      await Payment.deleteMany({
        subscription: subscription._id,
      });
    }

    await syncUserSubscriptionStatus(targetUser._id, {
      autoAssignFree: true,
    });

    const updatedSubscription = await getPopulatedSubscription(subscription._id);

    return res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: updatedSubscription,
    });
  } catch (error) {
    console.error("updateSubscriptionAdmin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update subscription",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: REFRESH SUBSCRIPTION FEATURES FROM PLAN
// =========================

export const refreshSubscriptionFeaturesAdmin = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId).populate(
      "plan"
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (!subscription.plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found for this subscription",
      });
    }

    subscription.planName = subscription.plan.name;
    subscription.planSlug = subscription.plan.slug;
    subscription.price = Number(subscription.plan.price);
    subscription.currency = subscription.plan.currency;
    subscription.durationInDays = Number(subscription.plan.durationInDays);
    subscription.features = convertFeaturesArrayToObject(
      subscription.plan.features || []
    );

    await subscription.save();

    const updatedSubscription = await getPopulatedSubscription(subscription._id);

    return res.status(200).json({
      success: true,
      message: "Subscription features refreshed from plan successfully",
      data: updatedSubscription,
    });
  } catch (error) {
    console.error("refreshSubscriptionFeaturesAdmin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to refresh subscription features",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: DELETE SUBSCRIPTION
// =========================

export const deleteSubscriptionAdmin = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    const userId = subscription.user;

    await Payment.deleteMany({
      subscription: subscription._id,
    });

    await Subscription.findByIdAndDelete(subscription._id);

    const fallbackSubscription = await syncUserSubscriptionStatus(userId, {
      autoAssignFree: true,
    });

    return res.status(200).json({
      success: true,
      message:
        "Subscription deleted successfully. Default free plan is active if no other active plan exists.",
      fallbackSubscription,
    });
  } catch (error) {
    console.error("deleteSubscriptionAdmin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete subscription",
      error: error.message,
    });
  }
};

// =========================
// ADMIN: MARK EXPIRED
// =========================

export const markExpiredSubscriptions = async (req, res) => {
  try {
    const result = await expireOldSubscriptions();

    return res.status(200).json({
      success: true,
      message:
        "Expired subscriptions marked successfully. Default free plans assigned where needed.",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("markExpiredSubscriptions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark expired subscriptions",
      error: error.message,
    });
  }
};