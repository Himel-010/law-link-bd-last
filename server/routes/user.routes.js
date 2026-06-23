import express from "express";

import {
  registerClient,
  registerLawyer,
  registerAdmin,
  loginUser,
  getMe,
  updateMyProfile,
  completeLawyerProfile,
  updateMyLawyerProfile,
  getPublicLawyers,
  getPublicLawyerById,
  getAllUsers,
  getUsersDropdown,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

import { protect, adminOnly, optionalProtect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/register/client", registerClient);
router.post("/register/lawyer", registerLawyer);
router.post("/register/admin", registerAdmin);

router.post("/login", loginUser);

router.get("/me", protect, getMe);

// Client self profile update
router.patch("/profile", protect, upload.single("profileImage"), updateMyProfile);

router.put(
  "/lawyer/profile/complete",
  protect,
  upload.single("profileImage"),
  completeLawyerProfile
);

router.patch(
  "/lawyer/profile",
  protect,
  upload.single("profileImage"),
  updateMyLawyerProfile
);

// Public routes, but optionalProtect allows paid clients/admin to see full lawyer details
router.get("/lawyers", optionalProtect, getPublicLawyers);
router.get("/lawyers/:id", optionalProtect, getPublicLawyerById);

router.get("/dropdown", protect, adminOnly, getUsersDropdown);
router.get("/", protect, adminOnly, getAllUsers);

router.put("/:id", protect, adminOnly, upload.single("profileImage"), updateUser);
router.delete("/:id", protect, adminOnly, deleteUser);

export default router;