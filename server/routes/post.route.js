import express from "express";
import mongoose from "mongoose";

import {
  createPost,
  getAllPosts,
  getSinglePost,
  getMyPosts,
  updatePost,
  deletePost,
  placeBid,
  withdrawBid,
  acceptBid,
  closePost,
  cancelPost,
  adminGetAllPosts,
  adminGetSinglePost,
  adminCreatePost,
  adminUpdatePost,
  adminDeletePost,
} from "../controllers/post.controller.js";

import { protect, authorizeRoles } from "../middleware/auth.js";
import {
  requireActiveSubscription,
  checkNumericFeatureLimit,
} from "../middleware/subscriptionAccess.js";

import Post from "../models/post.model.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                               CLIENT SPECIAL                               */
/* -------------------------------------------------------------------------- */

router.get(
  "/client/my-posts",
  protect,
  authorizeRoles("client"),
  getMyPosts
);

/* -------------------------------------------------------------------------- */
/*                                  ADMIN                                     */
/* -------------------------------------------------------------------------- */

router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  adminGetAllPosts
);

router.get(
  "/admin/:id",
  protect,
  authorizeRoles("admin"),
  adminGetSinglePost
);

router.post(
  "/admin/create",
  protect,
  authorizeRoles("admin"),
  adminCreatePost
);

router.patch(
  "/admin/update/:id",
  protect,
  authorizeRoles("admin"),
  adminUpdatePost
);

router.delete(
  "/admin/delete/:id",
  protect,
  authorizeRoles("admin"),
  adminDeletePost
);

/* -------------------------------------------------------------------------- */
/*                                  PUBLIC                                    */
/* -------------------------------------------------------------------------- */

router.get("/", getAllPosts);

router.get("/:id", getSinglePost);

/* -------------------------------------------------------------------------- */
/*                                  CLIENT                                    */
/* -------------------------------------------------------------------------- */

router.post(
  "/",
  protect,
  authorizeRoles("client"),
  requireActiveSubscription,
  checkNumericFeatureLimit("case_post_limit", async (req) => {
    return Post.countDocuments({
      client: req.user.id,
      createdAt: {
        $gte: req.subscription.startDate,
        $lte: req.subscription.endDate,
      },
    });
  }),
  createPost
);

router.patch(
  "/:id",
  protect,
  authorizeRoles("client", "admin"),
  updatePost
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("client", "admin"),
  deletePost
);

router.patch(
  "/:id/accept-bid/:bidId",
  protect,
  authorizeRoles("client", "admin"),
  acceptBid
);

router.patch(
  "/:id/close",
  protect,
  authorizeRoles("client", "admin"),
  closePost
);

router.patch(
  "/:id/cancel",
  protect,
  authorizeRoles("client", "admin"),
  cancelPost
);

/* -------------------------------------------------------------------------- */
/*                                  LAWYER                                    */
/* -------------------------------------------------------------------------- */

router.post(
  "/:id/bid",
  protect,
  authorizeRoles("lawyer"),
  requireActiveSubscription,
  checkNumericFeatureLimit("proposal_limit", async (req) => {
    const result = await Post.aggregate([
      {
        $unwind: "$bids",
      },
      {
        $match: {
          "bids.lawyer": new mongoose.Types.ObjectId(req.user.id),
          "bids.createdAt": {
            $gte: req.subscription.startDate,
            $lte: req.subscription.endDate,
          },
        },
      },
      {
        $count: "total",
      },
    ]);

    return result[0]?.total || 0;
  }),
  placeBid
);

router.patch(
  "/:id/withdraw-bid/:bidId",
  protect,
  authorizeRoles("lawyer"),
  withdrawBid
);

export default router;