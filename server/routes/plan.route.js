import express from "express";

import {
  createPlan,
  getPublicPlans,
  getAllPlansAdmin,
  getPublicPlanById,
  getPlanByIdAdmin,
  updatePlan,
  deletePlan,
} from "../controllers/plan.controller.js";

import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Public list
router.get("/", getPublicPlans);

// Admin fixed routes first
router.post("/", protect, authorizeRoles("admin"), createPlan);
router.get("/admin/all/list", protect, authorizeRoles("admin"), getAllPlansAdmin);
router.get("/admin/:planId", protect, authorizeRoles("admin"), getPlanByIdAdmin);
router.patch("/admin/:planId", protect, authorizeRoles("admin"), updatePlan);
router.delete("/admin/:planId", protect, authorizeRoles("admin"), deletePlan);

// Public dynamic route last
router.get("/:planId", getPublicPlanById);

export default router;