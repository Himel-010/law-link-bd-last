import Plan from "../models/plan.model.js";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";

const normalizeSlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeFeatureKey = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

export const convertFeaturesArrayToObject = (features = []) => {
  const result = {};

  if (!Array.isArray(features)) return result;

  features.forEach((feature) => {
    if (!feature?.enabled) return;

    const key = normalizeFeatureKey(feature.key);

    if (!key) return;

    if (feature.valueType === "number") {
      const numberValue = Number(feature.value);
      result[key] = Number.isFinite(numberValue) ? numberValue : 0;
      return;
    }

    if (feature.valueType === "boolean") {
      if (typeof feature.value === "string") {
        result[key] = feature.value === "true";
      } else {
        result[key] = Boolean(feature.value);
      }

      return;
    }

    result[key] = String(feature.value ?? "").trim();
  });

  return result;
};

const normalizeFeatureObject = (feature = {}, index = 0) => {
  const key = normalizeFeatureKey(feature.key || feature.label);

  if (!key) return null;

  const valueType = ["number", "boolean", "string"].includes(feature.valueType)
    ? feature.valueType
    : typeof feature.value === "number"
    ? "number"
    : typeof feature.value === "boolean"
    ? "boolean"
    : "string";

  let value = feature.value;

  if (valueType === "number") {
    value = Number(value);

    if (!Number.isFinite(value) || value < 0) {
      value = 0;
    }
  }

  if (valueType === "boolean") {
    if (typeof value === "string") {
      value = value === "true";
    } else {
      value = Boolean(value);
    }
  }

  if (valueType === "string") {
    value = String(value ?? "").trim();
  }

  return {
    key,
    label: String(feature.label || key).trim(),
    description: String(feature.description || "").trim(),
    valueType,
    value,
    enabled: feature.enabled === undefined ? true : Boolean(feature.enabled),
    sortOrder:
      feature.sortOrder === undefined ? index : Number(feature.sortOrder || 0),
  };
};

const mergePlanFeatures = (existingFeatures = [], requiredFeatures = []) => {
  const featureMap = new Map();

  if (Array.isArray(existingFeatures)) {
    existingFeatures.forEach((feature, index) => {
      const normalized = normalizeFeatureObject(feature, index);

      if (normalized) {
        featureMap.set(normalized.key, normalized);
      }
    });
  }

  if (Array.isArray(requiredFeatures)) {
    requiredFeatures.forEach((feature, index) => {
      const normalized = normalizeFeatureObject(feature, index);

      if (!normalized) return;

      featureMap.set(normalized.key, {
        ...(featureMap.get(normalized.key) || {}),
        ...normalized,
        enabled: true,
      });
    });
  }

  return Array.from(featureMap.values()).sort(
    (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)
  );
};

export const calculateEndDate = (startDate, durationInDays) => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Number(durationInDays || 30));
  return endDate;
};

const FREE_PLAN_CONFIG = {
  client: {
    name: "Client Free",
    slug: "client-free",
    roleType: "client",
    description: "Default free client plan",
    price: 0,
    durationInDays: 30,
    currency: "BDT",
    isActive: true,
    sortOrder: 0,
    features: [
      {
        key: "case_post_limit",
        label: "Case Post Limit",
        description: "Maximum number of case posts allowed in this plan",
        valueType: "number",
        value: 1,
        enabled: true,
        sortOrder: 1,
      },
      {
        key: "connection_request_limit",
        label: "Connection Request Limit",
        description: "Maximum number of connection requests allowed in this plan",
        valueType: "number",
        value: 2,
        enabled: true,
        sortOrder: 2,
      },
      {
        key: "booking_request_limit",
        label: "Booking Request Limit",
        description: "Maximum consultation booking requests allowed in this plan",
        valueType: "number",
        value: 1,
        enabled: true,
        sortOrder: 3,
      },
      {
        key: "in_app_messaging",
        label: "In App Messaging",
        description: "Allow user to send and receive messages",
        valueType: "boolean",
        value: true,
        enabled: true,
        sortOrder: 4,
      },
      {
        key: "message_limit",
        label: "Message Limit",
        description: "Maximum messages allowed within the reset period",
        valueType: "number",
        value: 10,
        enabled: true,
        sortOrder: 5,
      },
      {
        key: "message_reset_days",
        label: "Message Reset Days",
        description: "Message limit refresh period in days",
        valueType: "number",
        value: 7,
        enabled: true,
        sortOrder: 6,
      },
      {
        key: "lawyer_detail_access",
        label: "Lawyer Detail Access",
        description:
          "Allow client to view full lawyer profile details such as contact, city, fee, office address and profile image",
        valueType: "boolean",
        value: false,
        enabled: true,
        sortOrder: 7,
      },
      {
        key: "contact_unlock",
        label: "Contact Unlock",
        description: "Allow user to view contact details",
        valueType: "boolean",
        value: false,
        enabled: true,
        sortOrder: 8,
      },
      {
        key: "priority_post",
        label: "Priority Post",
        description: "Allow client to create priority posts",
        valueType: "boolean",
        value: false,
        enabled: true,
        sortOrder: 9,
      },
    ],
  },

  lawyer: {
    name: "Lawyer Free",
    slug: "lawyer-free",
    roleType: "lawyer",
    description: "Default free lawyer plan",
    price: 0,
    durationInDays: 30,
    currency: "BDT",
    isActive: true,
    sortOrder: 0,
    features: [
      {
        key: "proposal_limit",
        label: "Proposal Limit",
        description: "Maximum number of proposals allowed in this plan",
        valueType: "number",
        value: 5,
        enabled: true,
        sortOrder: 1,
      },
      {
        key: "connection_request_limit",
        label: "Connection Request Limit",
        description: "Maximum number of connection requests allowed in this plan",
        valueType: "number",
        value: 3,
        enabled: true,
        sortOrder: 2,
      },
      {
        key: "availability_calendar_access",
        label: "Availability Calendar Access",
        description: "Allow lawyer to create and manage consultation availability calendar",
        valueType: "boolean",
        value: true,
        enabled: true,
        sortOrder: 3,
      },
      {
        key: "availability_slot_limit",
        label: "Availability Slot Limit",
        description: "Maximum active availability slots lawyer can create during the subscription period",
        valueType: "number",
        value: 10,
        enabled: true,
        sortOrder: 4,
      },
      {
        key: "in_app_messaging",
        label: "In App Messaging",
        description: "Allow user to send and receive messages",
        valueType: "boolean",
        value: true,
        enabled: true,
        sortOrder: 5,
      },
      {
        key: "message_limit",
        label: "Message Limit",
        description: "Maximum messages allowed within the reset period",
        valueType: "number",
        value: 10,
        enabled: true,
        sortOrder: 6,
      },
      {
        key: "message_reset_days",
        label: "Message Reset Days",
        description: "Message limit refresh period in days",
        valueType: "number",
        value: 7,
        enabled: true,
        sortOrder: 7,
      },
      {
        key: "booking_response_access",
        label: "Booking Response Access",
        description: "Allow lawyer to accept or reject consultation bookings",
        valueType: "boolean",
        value: true,
        enabled: true,
        sortOrder: 8,
      },
      {
        key: "contact_unlock",
        label: "Contact Unlock",
        description: "Allow user to view contact details",
        valueType: "boolean",
        value: false,
        enabled: true,
        sortOrder: 9,
      },
      {
        key: "profile_boost",
        label: "Profile Boost",
        description: "Boost lawyer profile visibility in public search",
        valueType: "boolean",
        value: false,
        enabled: true,
        sortOrder: 10,
      },
    ],
  },
};

export const ensureFreePlanForRole = async (roleType) => {
  if (!["client", "lawyer"].includes(roleType)) return null;

  const config = FREE_PLAN_CONFIG[roleType];

  let plan = await Plan.findOne({
    roleType,
    slug: config.slug,
  });

  if (plan) {
    const mergedFeatures = mergePlanFeatures(plan.features || [], config.features);

    plan.name = config.name;
    plan.slug = normalizeSlug(config.slug);
    plan.roleType = config.roleType;
    plan.description = config.description;
    plan.price = config.price;
    plan.durationInDays = config.durationInDays;
    plan.currency = config.currency;
    plan.isActive = true;
    plan.sortOrder = config.sortOrder;
    plan.features = mergedFeatures;

    await plan.save();

    return plan;
  }

  plan = await Plan.create({
    ...config,
    slug: normalizeSlug(config.slug),
    features: mergePlanFeatures([], config.features),
  });

  return plan;
};

const findActiveSubscription = async (userId) => {
  if (!userId) return null;

  return Subscription.findOne({
    user: userId,
    status: "active",
    startDate: { $lte: new Date() },
    endDate: { $gt: new Date() },
  })
    .populate("plan")
    .sort({ endDate: -1, createdAt: -1 });
};

const expireUserOldActiveSubscriptions = async (userId) => {
  if (!userId) return;

  await Subscription.updateMany(
    {
      user: userId,
      status: "active",
      endDate: { $lte: new Date() },
    },
    {
      $set: {
        status: "expired",
      },
    }
  );
};

const assignDefaultFreeSubscriptionToUser = async (user) => {
  if (!user || !["client", "lawyer"].includes(user.role)) return null;

  await expireUserOldActiveSubscriptions(user._id);

  const existingActive = await findActiveSubscription(user._id);

  if (existingActive) {
    await User.findByIdAndUpdate(user._id, {
      currentSubscription: existingActive._id,
      subscriptionStatus: "active",
    });

    return existingActive;
  }

  const plan = await ensureFreePlanForRole(user.role);

  if (!plan) return null;

  const now = new Date();

  const subscription = await Subscription.create({
    user: user._id,
    plan: plan._id,
    roleType: plan.roleType,
    planName: plan.name,
    planSlug: plan.slug,
    price: plan.price,
    currency: plan.currency,
    durationInDays: plan.durationInDays,
    features: convertFeaturesArrayToObject(plan.features),

    status: "active",
    startDate: now,
    endDate: calculateEndDate(now, plan.durationInDays),
    activatedAt: now,
    cancelledAt: null,

    payment: {
      status: "free",
      transactionId: null,
      method: null,
      paidAt: null,
    },
  });

  await User.findByIdAndUpdate(user._id, {
    currentSubscription: subscription._id,
    subscriptionStatus: "active",
  });

  return subscription.populate("plan");
};

export const getActiveSubscription = async (
  userId,
  options = { autoAssignFree: true }
) => {
  if (!userId) return null;

  await expireUserOldActiveSubscriptions(userId);

  const activeSub = await findActiveSubscription(userId);

  if (activeSub) return activeSub;

  if (options?.autoAssignFree === false) return null;

  const user = await User.findById(userId).select("_id role");

  if (!user || !["client", "lawyer"].includes(user.role)) return null;

  return assignDefaultFreeSubscriptionToUser(user);
};

export const syncUserSubscriptionStatus = async (
  userId,
  options = { autoAssignFree: true }
) => {
  if (!userId) return null;

  await expireUserOldActiveSubscriptions(userId);

  const activeSub = await findActiveSubscription(userId);

  if (activeSub) {
    await User.findByIdAndUpdate(userId, {
      currentSubscription: activeSub._id,
      subscriptionStatus: "active",
    });

    return activeSub;
  }

  if (options?.autoAssignFree !== false) {
    const user = await User.findById(userId).select("_id role");

    if (user && ["client", "lawyer"].includes(user.role)) {
      return assignDefaultFreeSubscriptionToUser(user);
    }
  }

  const latestSub = await Subscription.findOne({ user: userId }).sort({
    createdAt: -1,
  });

  await User.findByIdAndUpdate(userId, {
    currentSubscription: null,
    subscriptionStatus: latestSub?.status || "none",
  });

  return null;
};

export const assignFreeSubscriptionToUser = async (user) => {
  return assignDefaultFreeSubscriptionToUser(user);
};

export const getFeatureValue = async (userId, featureKey, fallback = null) => {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) return fallback;

  const key = normalizeFeatureKey(featureKey);

  if (!key) return fallback;

  if (!Object.prototype.hasOwnProperty.call(subscription.features || {}, key)) {
    return fallback;
  }

  return subscription.features[key];
};

export const getNumericFeatureValue = async (
  userId,
  featureKey,
  fallback = 0
) => {
  const value = await getFeatureValue(userId, featureKey, fallback);
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return fallback;

  return numberValue;
};

export const hasBooleanFeature = async (userId, featureKey) => {
  const value = await getFeatureValue(userId, featureKey, false);

  return value === true;
};

export const canUseFeature = async (userId, featureKey) => {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    return {
      allowed: false,
      message: "Active subscription required",
      subscription: null,
      value: null,
    };
  }

  const key = normalizeFeatureKey(featureKey);
  const value = subscription.features?.[key];

  if (value === undefined || value === null || value === false || value === 0) {
    return {
      allowed: false,
      message: `Your plan does not allow ${key}`,
      subscription,
      value,
    };
  }

  return {
    allowed: true,
    message: "Feature allowed",
    subscription,
    value,
  };
};

export const enableFeatureForActiveSubscription = async (
  userId,
  featureKey,
  value = true
) => {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) return null;

  const key = normalizeFeatureKey(featureKey);

  if (!key) return subscription;

  subscription.features = {
    ...(subscription.features || {}),
    [key]: value,
  };

  await subscription.save();

  return subscription;
};

export const enableMessagingForActiveSubscription = async (userId) => {
  return enableFeatureForActiveSubscription(userId, "in_app_messaging", true);
};

export const refreshSubscriptionFeaturesFromPlan = async (subscriptionId) => {
  const subscription = await Subscription.findById(subscriptionId).populate("plan");

  if (!subscription || !subscription.plan) return null;

  subscription.features = convertFeaturesArrayToObject(
    subscription.plan.features || []
  );

  subscription.planName = subscription.plan.name;
  subscription.planSlug = subscription.plan.slug;
  subscription.price = subscription.plan.price;
  subscription.currency = subscription.plan.currency;
  subscription.durationInDays = subscription.plan.durationInDays;

  await subscription.save();

  return subscription;
};

export const expireOldSubscriptions = async () => {
  const expiredSubscriptions = await Subscription.find({
    status: "active",
    endDate: { $lte: new Date() },
  }).select("user");

  const result = await Subscription.updateMany(
    {
      status: "active",
      endDate: { $lte: new Date() },
    },
    {
      $set: {
        status: "expired",
      },
    }
  );

  const userIds = [
    ...new Set(expiredSubscriptions.map((sub) => String(sub.user))),
  ];

  await Promise.all(
    userIds.map((userId) =>
      syncUserSubscriptionStatus(userId, { autoAssignFree: true })
    )
  );

  return result;
};