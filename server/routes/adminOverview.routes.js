import express from "express";
import { protect, authorizeRoles } from "../middleware/auth.js";

import { getAdminOverview } from "../controllers/adminOverview.controller.js";

const router = express.Router();

// =========================
// ADMIN OVERVIEW ROUTES
// =========================

router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAdminOverview
);

export default router;