import mongoose from "mongoose";
import dotenv from "dotenv";
import Plan from "../models/plan.model.js";
import Subscription from "../models/subscription.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const messagingFeature = {
  key: "in_app_messaging",
  label: "In App Messaging",
  description: "Allow client-lawyer in-app conversation after accepted connection",
  valueType: "boolean",
  value: true,
  enabled: true,
  sortOrder: 3,
};

const enableMessagingInPlanFeatures = async () => {
  const plans = await Plan.find({
    roleType: { $in: ["client", "lawyer"] },
  });

  for (const plan of plans) {
    const features = Array.isArray(plan.features) ? plan.features : [];

    const existingIndex = features.findIndex(
      (feature) => feature.key === "in_app_messaging"
    );

    if (existingIndex >= 0) {
      features[existingIndex].value = true;
      features[existingIndex].enabled = true;
      features[existingIndex].valueType = "boolean";
      features[existingIndex].label =
        features[existingIndex].label || "In App Messaging";
      features[existingIndex].sortOrder =
        features[existingIndex].sortOrder || 3;
    } else {
      features.push(messagingFeature);
    }

    plan.features = features.sort(
      (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)
    );

    await plan.save();
  }

  return plans.length;
};

const enableMessagingInSubscriptions = async () => {
  const result = await Subscription.updateMany(
    {
      roleType: { $in: ["client", "lawyer"] },
      status: "active",
    },
    {
      $set: {
        "features.in_app_messaging": true,
      },
    }
  );

  return result.modifiedCount || result.nModified || 0;
};

const run = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI or MONGODB_URI is missing in .env");
    }

    await mongoose.connect(MONGO_URI);

    const planCount = await enableMessagingInPlanFeatures();
    const subscriptionCount = await enableMessagingInSubscriptions();

    console.log("Messaging feature enabled successfully ✅");
    console.log(`Updated plans checked: ${planCount}`);
    console.log(`Updated active subscriptions: ${subscriptionCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Failed to enable messaging feature ❌");
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();