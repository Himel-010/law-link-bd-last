import express from "express";

import {
  createContactMessage,
  getAllContactMessages,
  getContactMessageById,
  updateContactMessage,
  markContactAsRead,
  deleteContactMessage,
  getContactStats,
} from "../controllers/contact.controller.js";

import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

/**
 * Public route
 * Anyone can send contact message
 */
router.post("/", createContactMessage);

/**
 * Admin routes
 * Only admin can manage contact messages
 */
router.get("/admin/stats", protect, adminOnly, getContactStats);
router.get("/admin", protect, adminOnly, getAllContactMessages);
router.get("/admin/:id", protect, adminOnly, getContactMessageById);
router.patch("/admin/:id", protect, adminOnly, updateContactMessage);
router.patch("/admin/:id/read", protect, adminOnly, markContactAsRead);
router.delete("/admin/:id", protect, adminOnly, deleteContactMessage);

export default router;