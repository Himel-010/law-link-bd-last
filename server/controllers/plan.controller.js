import Plan from "../models/plan.model.js";
import Subscription from "../models/subscription.model.js";
import { convertFeaturesArrayToObject } from "../utils/subscription.utils.js";

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

const validateAndNormalizeFeatures = (features = []) => {
  if (!Array.isArray(features)) {
    return {
      isValid: false,
      message: "features must be an array",
    };
  }

  const usedKeys = new Set();

  const normalizedFeatures = features.map((feature, index) => {
    const key = normalizeFeatureKey(feature.key || feature.label);

    if (!key) {
      throw new Error(`Feature at index ${index} must have a valid key or label`);
    }

    if (usedKeys.has(key)) {
      throw new Error(`Duplicate feature key found: ${key}`);
    }

    usedKeys.add(key);

    const valueType = feature.valueType || typeof feature.value;

    if (!["number", "boolean", "string"].includes(valueType)) {
      throw new Error(
        `Feature "${key}" has invalid valueType. Allowed: number, boolean, string`
      );
    }

    let value = feature.value;

    if (valueType === "number") {
      value = Number(value);

      if (Number.isNaN(value)) {
        throw new Error(`Feature "${key}" value must be a valid number`);
      }

      if (value < 0) {
        throw new Error(`Feature "${key}" value cannot be negative`);
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
        feature.sortOrder === undefined ? index : Number(feature.sortOrder),
    };
  });

  return {
    isValid: true,
    features: normalizedFeatures,
  };
};

export const createPlan = async (req, res) => {
  try {
    const {
      name,
      slug,
      roleType,
      description = "",
      price,
      durationInDays,
      currency = "BDT",
      isActive = true,
      sortOrder = 0,
      features = [],
    } = req.body;

    if (!name || !roleType || price === undefined || !durationInDays) {
      return res.status(400).json({
        success: false,
        message: "name, roleType, price and durationInDays are required",
      });
    }

    if (!["client", "lawyer"].includes(roleType)) {
      return res.status(400).json({
        success: false,
        message: "roleType must be either client or lawyer",
      });
    }

    const finalSlug = normalizeSlug(slug || name);

    if (!finalSlug) {
      return res.status(400).json({
        success: false,
        message: "Valid slug could not be generated",
      });
    }

    const existing = await Plan.findOne({
      slug: finalSlug,
      roleType,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Plan with this slug already exists for this role",
      });
    }

    let normalizedFeatures = [];

    try {
      const featureResult = validateAndNormalizeFeatures(features);

      if (!featureResult.isValid) {
        return res.status(400).json({
          success: false,
          message: featureResult.message,
        });
      }

      normalizedFeatures = featureResult.features;
    } catch (featureError) {
      return res.status(400).json({
        success: false,
        message: featureError.message,
      });
    }

    const plan = await Plan.create({
      name,
      slug: finalSlug,
      roleType,
      description,
      price: Number(price),
      durationInDays: Number(durationInDays),
      currency,
      isActive,
      sortOrder: Number(sortOrder),
      features: normalizedFeatures,
    });

    return res.status(201).json({
      success: true,
      message: "Plan created successfully",
      data: plan,
    });
  } catch (error) {
    console.error("createPlan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create plan",
      error: error.message,
    });
  }
};

export const getPublicPlans = async (req, res) => {
  try {
    const { roleType } = req.query;

    const filter = {
      isActive: true,
    };

    if (roleType) {
      if (!["client", "lawyer"].includes(roleType)) {
        return res.status(400).json({
          success: false,
          message: "roleType must be either client or lawyer",
        });
      }

      filter.roleType = roleType;
    }

    const plans = await Plan.find(filter).sort({
      roleType: 1,
      sortOrder: 1,
      price: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    console.error("getPublicPlans error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch plans",
      error: error.message,
    });
  }
};

export const getAllPlansAdmin = async (req, res) => {
  try {
    const { roleType, isActive } = req.query;

    const filter = {};

    if (roleType) {
      if (!["client", "lawyer"].includes(roleType)) {
        return res.status(400).json({
          success: false,
          message: "roleType must be either client or lawyer",
        });
      }

      filter.roleType = roleType;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const plans = await Plan.find(filter).sort({
      roleType: 1,
      sortOrder: 1,
      price: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    console.error("getAllPlansAdmin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch all plans",
      error: error.message,
    });
  }
};

export const getPublicPlanById = async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await Plan.findOne({
      _id: planId,
      isActive: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("getPublicPlanById error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch plan",
      error: error.message,
    });
  }
};

export const getPlanByIdAdmin = async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("getPlanByIdAdmin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch plan",
      error: error.message,
    });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updateData = { ...req.body };

    const existingPlan = await Plan.findById(planId);

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    if (
      updateData.roleType &&
      !["client", "lawyer"].includes(updateData.roleType)
    ) {
      return res.status(400).json({
        success: false,
        message: "roleType must be either client or lawyer",
      });
    }

    if (updateData.slug || updateData.name) {
      updateData.slug = normalizeSlug(updateData.slug || updateData.name);

      if (!updateData.slug) {
        return res.status(400).json({
          success: false,
          message: "Valid slug could not be generated",
        });
      }
    }

    if (updateData.slug || updateData.roleType) {
      const duplicate = await Plan.findOne({
        _id: { $ne: planId },
        slug: updateData.slug || existingPlan.slug,
        roleType: updateData.roleType || existingPlan.roleType,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Another plan with this slug already exists for this role",
        });
      }
    }

    if (updateData.features !== undefined) {
      try {
        const featureResult = validateAndNormalizeFeatures(updateData.features);

        if (!featureResult.isValid) {
          return res.status(400).json({
            success: false,
            message: featureResult.message,
          });
        }

        updateData.features = featureResult.features;
      } catch (featureError) {
        return res.status(400).json({
          success: false,
          message: featureError.message,
        });
      }
    }

    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);
    }

    if (updateData.durationInDays !== undefined) {
      updateData.durationInDays = Number(updateData.durationInDays);
    }

    if (updateData.sortOrder !== undefined) {
      updateData.sortOrder = Number(updateData.sortOrder);
    }

    const updatedPlan = await Plan.findByIdAndUpdate(planId, updateData, {
      new: true,
      runValidators: true,
    });

    const syncedSubscriptionsResult = await Subscription.updateMany(
      {
        plan: updatedPlan._id,
        status: { $in: ["active", "pending"] },
      },
      {
        $set: {
          roleType: updatedPlan.roleType,
          planName: updatedPlan.name,
          planSlug: updatedPlan.slug,
          price: Number(updatedPlan.price),
          currency: updatedPlan.currency,
          durationInDays: Number(updatedPlan.durationInDays),
          features: convertFeaturesArrayToObject(updatedPlan.features),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Plan updated successfully and active/pending subscriptions synced",
      data: updatedPlan,
      syncedSubscriptions: {
        matchedCount: syncedSubscriptionsResult.matchedCount,
        modifiedCount: syncedSubscriptionsResult.modifiedCount,
      },
    });
  } catch (error) {
    console.error("updatePlan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update plan",
      error: error.message,
    });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    const activeOrPendingSubscriptions = await Subscription.countDocuments({
      plan: plan._id,
      status: { $in: ["active", "pending"] },
    });

    if (activeOrPendingSubscriptions > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This plan has active or pending subscriptions. Deactivate the plan instead of deleting it.",
        activeOrPendingSubscriptions,
      });
    }

    await Plan.findByIdAndDelete(planId);

    return res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("deletePlan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete plan",
      error: error.message,
    });
  }
};