import Subscription from "../models/subscription.model.js";

export const requireActiveSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    const subscription = await Subscription.findOne({
      user: userId,
      status: "active",
      endDate: { $gt: new Date() },
    }).sort({ endDate: -1 });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required",
      });
    }

    req.subscription = subscription;
    req.planFeatures = subscription.features || {};

    next();
  } catch (error) {
    console.error("requireActiveSubscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check subscription",
      error: error.message,
    });
  }
};

export const requireFeature = (featureKey) => {
  return (req, res, next) => {
    const features = req.planFeatures || {};

    if (!features[featureKey]) {
      return res.status(403).json({
        success: false,
        message: `Your plan does not include ${featureKey}`,
      });
    }

    next();
  };
};

export const checkNumericFeatureLimit = (featureKey, currentCountGetter) => {
  return async (req, res, next) => {
    try {
      const features = req.planFeatures || {};
      const limit = Number(features[featureKey] || 0);

      if (limit <= 0) {
        return res.status(403).json({
          success: false,
          message: `Your plan does not allow ${featureKey}`,
        });
      }

      const currentCount = await currentCountGetter(req);

      if (currentCount >= limit) {
        return res.status(403).json({
          success: false,
          message: `You have reached your plan limit for ${featureKey}`,
          limit,
          currentCount,
        });
      }

      next();
    } catch (error) {
      console.error("checkNumericFeatureLimit error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to check feature limit",
        error: error.message,
      });
    }
  };
};