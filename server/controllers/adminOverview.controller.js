import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Payment from "../models/payment.model.js";
import Plan from "../models/plan.model.js";
import Subscription from "../models/subscription.model.js";
import Connection from "../models/connection.model.js";

const getCurrentMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const getLastMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
};

const getLastMonthEnd = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
};

const getPercentageChange = (current, previous) => {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const getAggregateTotal = (result) => {
  return result?.[0]?.total || 0;
};

const getAggregateCount = (result) => {
  return result?.[0]?.count || 0;
};

// =========================
// ADMIN OVERVIEW DASHBOARD
// =========================

export const getAdminOverview = async (req, res, next) => {
  try {
    const currentMonthStart = getCurrentMonthStart();
    const lastMonthStart = getLastMonthStart();
    const lastMonthEnd = getLastMonthEnd();

    const [
      totalUsers,
      totalClients,
      totalLawyers,
      totalAdmins,

      activeSubscriptions,
      pendingSubscriptions,
      expiredSubscriptions,
      cancelledSubscriptions,

      totalPlans,
      activePlans,
      inactivePlans,

      totalPosts,
      openPosts,
      inProgressPosts,
      closedPosts,
      cancelledPosts,
      priorityPosts,

      totalConnections,
      pendingConnections,
      acceptedConnections,
      rejectedConnections,
      cancelledConnections,
      blockedConnections,

      pendingPayments,
      verifiedPayments,
      rejectedPayments,
      refundedPayments,

      totalRevenueResult,
      currentMonthRevenueResult,
      lastMonthRevenueResult,

      totalBidsResult,
      pendingBidsResult,
      acceptedBidsResult,
      rejectedBidsResult,
      withdrawnBidsResult,

      recentUsers,
      recentPosts,
      recentPayments,
      recentConnections,
      recentSubscriptions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "client" }),
      User.countDocuments({ role: "lawyer" }),
      User.countDocuments({ role: "admin" }),

      Subscription.countDocuments({ status: "active" }),
      Subscription.countDocuments({ status: "pending" }),
      Subscription.countDocuments({ status: "expired" }),
      Subscription.countDocuments({ status: "cancelled" }),

      Plan.countDocuments(),
      Plan.countDocuments({ isActive: true }),
      Plan.countDocuments({ isActive: false }),

      Post.countDocuments(),
      Post.countDocuments({ status: "open" }),
      Post.countDocuments({ status: "in_progress" }),
      Post.countDocuments({ status: "closed" }),
      Post.countDocuments({ status: "cancelled" }),
      Post.countDocuments({ isPriority: 1 }),

      Connection.countDocuments(),
      Connection.countDocuments({ status: "pending" }),
      Connection.countDocuments({ status: "accepted" }),
      Connection.countDocuments({ status: "rejected" }),
      Connection.countDocuments({ status: "cancelled" }),
      Connection.countDocuments({ status: "blocked" }),

      Payment.countDocuments({ paymentStatus: "pending" }),
      Payment.countDocuments({ paymentStatus: "verified" }),
      Payment.countDocuments({ paymentStatus: "rejected" }),
      Payment.countDocuments({ paymentStatus: "refunded" }),

      Payment.aggregate([
        {
          $match: {
            paymentStatus: "verified",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            paymentStatus: "verified",
            createdAt: { $gte: currentMonthStart },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            paymentStatus: "verified",
            createdAt: {
              $gte: lastMonthStart,
              $lte: lastMonthEnd,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),

      Post.aggregate([
        { $unwind: "$bids" },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]),

      Post.aggregate([
        { $unwind: "$bids" },
        {
          $match: {
            "bids.status": "pending",
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]),

      Post.aggregate([
        { $unwind: "$bids" },
        {
          $match: {
            "bids.status": "accepted",
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]),

      Post.aggregate([
        { $unwind: "$bids" },
        {
          $match: {
            "bids.status": "rejected",
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]),

      Post.aggregate([
        { $unwind: "$bids" },
        {
          $match: {
            "bids.status": "withdrawn",
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]),

      User.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select("name email role subscriptionStatus createdAt"),

      Post.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("client", "name email role")
        .select(
          "client title category budgetMin budgetMax urgency status isPriority createdAt"
        ),

      Payment.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("user", "name email role")
        .populate("plan", "name roleType")
        .select(
          "user subscription plan roleType planName amount currency method transactionId paymentStatus createdAt"
        ),

      Connection.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("client", "name email role")
        .populate("lawyer", "name email role")
        .populate("post", "title category status")
        .populate("requestedBy", "name email role")
        .select(
          "client lawyer post requestedBy requestMessage status responseMessage lastMessageAt createdAt"
        ),

      Subscription.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("user", "name email role")
        .populate("plan", "name roleType")
        .select(
          "user plan roleType planName planSlug price currency status startDate endDate createdAt"
        ),
    ]);

    const totalRevenue = getAggregateTotal(totalRevenueResult);
    const currentMonthRevenue = getAggregateTotal(currentMonthRevenueResult);
    const lastMonthRevenue = getAggregateTotal(lastMonthRevenueResult);

    const revenueGrowth = getPercentageChange(
      currentMonthRevenue,
      lastMonthRevenue
    );

    const totalBids = getAggregateCount(totalBidsResult);
    const pendingBids = getAggregateCount(pendingBidsResult);
    const acceptedBids = getAggregateCount(acceptedBidsResult);
    const rejectedBids = getAggregateCount(rejectedBidsResult);
    const withdrawnBids = getAggregateCount(withdrawnBidsResult);

    const connectionAcceptanceRate =
      totalConnections > 0
        ? Number(((acceptedConnections / totalConnections) * 100).toFixed(1))
        : 0;

    const bidAcceptanceRate =
      totalBids > 0
        ? Number(((acceptedBids / totalBids) * 100).toFixed(1))
        : 0;

    const postCompletionRate =
      totalPosts > 0
        ? Number(((closedPosts / totalPosts) * 100).toFixed(1))
        : 0;

    return res.status(200).json({
      success: true,
      message: "Admin overview fetched successfully",
      data: {
        stats: {
          revenue: {
            totalRevenue,
            currentMonthRevenue,
            lastMonthRevenue,
            revenueGrowth,
          },

          users: {
            totalUsers,
            totalClients,
            totalLawyers,
            totalAdmins,
          },

          subscriptions: {
            activeSubscriptions,
            pendingSubscriptions,
            expiredSubscriptions,
            cancelledSubscriptions,
          },

          plans: {
            totalPlans,
            activePlans,
            inactivePlans,
          },

          posts: {
            totalPosts,
            openPosts,
            inProgressPosts,
            closedPosts,
            cancelledPosts,
            priorityPosts,
            postCompletionRate,
          },

          bids: {
            totalBids,
            pendingBids,
            acceptedBids,
            rejectedBids,
            withdrawnBids,
            bidAcceptanceRate,
          },

          connections: {
            totalConnections,
            pendingConnections,
            acceptedConnections,
            rejectedConnections,
            cancelledConnections,
            blockedConnections,
            connectionAcceptanceRate,
          },

          payments: {
            pendingPayments,
            verifiedPayments,
            rejectedPayments,
            refundedPayments,
          },
        },

        cards: [
          {
            key: "totalRevenue",
            title: "Total Revenue",
            value: totalRevenue,
            type: "currency",
            change: revenueGrowth,
            description: "Verified payments only",
          },
          {
            key: "totalUsers",
            title: "Total Users",
            value: totalUsers,
            type: "number",
            change: null,
            description: `${totalClients} clients, ${totalLawyers} lawyers`,
          },
          {
            key: "openPosts",
            title: "Open Posts",
            value: openPosts,
            type: "number",
            change: null,
            description: `${priorityPosts} priority posts`,
          },
          {
            key: "bidsProposals",
            title: "Bids & Proposals",
            value: totalBids,
            type: "number",
            change: bidAcceptanceRate,
            description: `${pendingBids} pending bids`,
          },
          {
            key: "connections",
            title: "Connections",
            value: totalConnections,
            type: "number",
            change: connectionAcceptanceRate,
            description: `${acceptedConnections} accepted connections`,
          },
          {
            key: "activeSubscriptions",
            title: "Active Subscriptions",
            value: activeSubscriptions,
            type: "number",
            change: null,
            description: `${pendingSubscriptions} pending subscriptions`,
          },
        ],

        charts: {
          usersByRole: [
            { label: "Clients", value: totalClients },
            { label: "Lawyers", value: totalLawyers },
            { label: "Admins", value: totalAdmins },
          ],

          postsByStatus: [
            { label: "Open", value: openPosts },
            { label: "In Progress", value: inProgressPosts },
            { label: "Closed", value: closedPosts },
            { label: "Cancelled", value: cancelledPosts },
          ],

          bidsByStatus: [
            { label: "Pending", value: pendingBids },
            { label: "Accepted", value: acceptedBids },
            { label: "Rejected", value: rejectedBids },
            { label: "Withdrawn", value: withdrawnBids },
          ],

          connectionsByStatus: [
            { label: "Pending", value: pendingConnections },
            { label: "Accepted", value: acceptedConnections },
            { label: "Rejected", value: rejectedConnections },
            { label: "Cancelled", value: cancelledConnections },
            { label: "Blocked", value: blockedConnections },
          ],

          paymentsByStatus: [
            { label: "Pending", value: pendingPayments },
            { label: "Verified", value: verifiedPayments },
            { label: "Rejected", value: rejectedPayments },
            { label: "Refunded", value: refundedPayments },
          ],

          subscriptionsByStatus: [
            { label: "Active", value: activeSubscriptions },
            { label: "Pending", value: pendingSubscriptions },
            { label: "Expired", value: expiredSubscriptions },
            { label: "Cancelled", value: cancelledSubscriptions },
          ],
        },

        recent: {
          users: recentUsers,
          posts: recentPosts,
          payments: recentPayments,
          connections: recentConnections,
          subscriptions: recentSubscriptions,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};