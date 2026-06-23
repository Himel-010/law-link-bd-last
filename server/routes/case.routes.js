import express from "express";
import { protect } from "../middleware/auth.js";
import {
  requireActiveSubscription,
  checkNumericFeatureLimit,
} from "../middleware/subscriptionAccess.js";

import Case from "../models/case.model.js";
import { createCase } from "../controllers/case.controller.js";

const router = express.Router();

router.post(
  "/",
  protect,
  requireActiveSubscription,
  checkNumericFeatureLimit("case_post_limit", async (req) => {
    return Case.countDocuments({
      client: req.user.id,
      createdAt: {
        $gte: req.subscription.startDate,
        $lte: req.subscription.endDate,
      },
    });
  }),
  createCase
);

export default router;