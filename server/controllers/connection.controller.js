import mongoose from "mongoose";
import Connection from "../models/connection.model.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import ConsultationBooking from "../models/consultationBooking.model.js";
import {
  getActiveSubscription,
  hasBooleanFeature,
} from "../utils/subscription.utils.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const LAWYER_NOT_APPROVED_MESSAGE =
  "Lawyer account is not approved yet. Please complete your profile and wait for admin verification.";

const isApprovedLawyer = (lawyer) => {
  return Boolean(
    lawyer &&
      lawyer.role === "lawyer" &&
      lawyer.profileCompleted === true &&
      lawyer.phoneVerified === 1 &&
      lawyer.isVerifiedLawyer === true
  );
};

const getLawyerApprovalData = async (lawyerId) => {
  if (!lawyerId || !isValidObjectId(lawyerId)) return null;

  return User.findOne({
    _id: lawyerId,
    role: "lawyer",
  })
    .select("_id role name email phoneVerified profileCompleted isVerifiedLawyer")
    .lean();
};

const ensureCurrentLawyerApproved = async (req, res) => {
  if (req.user.role !== "lawyer") return true;

  const lawyer = await getLawyerApprovalData(req.user.id);

  if (!isApprovedLawyer(lawyer)) {
    res.status(403).json({
      success: false,
      message: LAWYER_NOT_APPROVED_MESSAGE,
    });
    return false;
  }

  return true;
};

const ensureSelectedLawyerApproved = async (lawyerId, res) => {
  const lawyer = await getLawyerApprovalData(lawyerId);

  if (!lawyer) {
    res.status(404).json({
      success: false,
      message: "Lawyer not found",
    });
    return false;
  }

  if (!isApprovedLawyer(lawyer)) {
    res.status(403).json({
      success: false,
      message: "This lawyer is not approved yet.",
    });
    return false;
  }

  return true;
};

const ensureConnectionLawyerApproved = async (connection, res) => {
  const lawyerId = connection.lawyer?._id || connection.lawyer;
  const lawyer = await getLawyerApprovalData(lawyerId);

  if (!isApprovedLawyer(lawyer)) {
    res.status(403).json({
      success: false,
      message: "This lawyer is not approved yet.",
    });
    return false;
  }

  return true;
};

const normalizeAttachments = (attachments) => {
  if (Array.isArray(attachments)) {
    return attachments.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof attachments === "string") {
    return attachments
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const populateConnection = (query) => {
  return query
    .populate(
      "client",
      "name email phone role subscriptionStatus currentSubscription"
    )
    .populate(
      "lawyer",
      "name email phone role lawRegNumber phoneVerified profileCompleted isVerifiedLawyer subscriptionStatus currentSubscription"
    )
    .populate("post", "title category status budgetMin budgetMax client")
    .populate(
      "booking",
      "client lawyer requestedDate requestedTime consultationType subject message responseMessage status acceptedAt cancelledAt completedAt"
    )
    .populate("requestedBy", "name email role")
    .populate("messages.sender", "name email role");
};

const isConnectionParticipant = (req, connection) => {
  const userId = String(req.user.id);

  return (
    String(connection.client?._id || connection.client) === userId ||
    String(connection.lawyer?._id || connection.lawyer) === userId
  );
};

const canAccessConnection = (req, connection) => {
  return req.user.role === "admin" || isConnectionParticipant(req, connection);
};

const canRespondConnection = (req, connection) => {
  const userId = String(req.user.id);

  if (req.user.role === "admin") return true;

  if (String(connection.requestedBy?._id || connection.requestedBy) === userId) {
    return false;
  }

  return isConnectionParticipant(req, connection);
};

const buildConnectionFilter = (req) => {
  const filter = {};

  if (req.user.role === "client") {
    filter.client = req.user.id;
  }

  if (req.user.role === "lawyer") {
    filter.lawyer = req.user.id;
  }

  if (req.user.role === "admin") {
    if (req.query.client && isValidObjectId(req.query.client)) {
      filter.client = req.query.client;
    }

    if (req.query.lawyer && isValidObjectId(req.query.lawyer)) {
      filter.lawyer = req.query.lawyer;
    }
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.sourceType && ["post", "booking"].includes(req.query.sourceType)) {
    filter.sourceType = req.query.sourceType;
  }

  if (req.query.post && isValidObjectId(req.query.post)) {
    filter.post = req.query.post;
  }

  if (req.query.booking && isValidObjectId(req.query.booking)) {
    filter.booking = req.query.booking;
  }

  return filter;
};

const ensureMessagingAllowed = async (req) => {
  if (req.user.role === "admin") return true;

  if (!["client", "lawyer"].includes(req.user.role)) return false;

  const activeSubscription = await getActiveSubscription(req.user.id);

  if (!activeSubscription) return false;

  return activeSubscription.features?.in_app_messaging === true;
};

const normalizeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getMessageResetStartDate = (resetDays = 7) => {
  const safeResetDays = Math.max(normalizeNumber(resetDays, 7), 1);
  const date = new Date();

  date.setDate(date.getDate() - safeResetDays);

  return date;
};

const getUserMessageUsage = async ({ userId, resetStartDate }) => {
  if (!userId || !isValidObjectId(userId)) return 0;

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const result = await Connection.aggregate([
    {
      $match: {
        status: "accepted",
        $or: [{ client: userObjectId }, { lawyer: userObjectId }],
      },
    },
    {
      $unwind: "$messages",
    },
    {
      $match: {
        "messages.sender": userObjectId,
        "messages.createdAt": { $gte: resetStartDate },
      },
    },
    {
      $count: "used",
    },
  ]);

  return result[0]?.used || 0;
};

const checkMessageLimitAccess = async (req) => {
  if (req.user.role === "admin") {
    return {
      allowed: true,
      messageLimit: 999999,
      resetDays: 7,
      usedMessages: 0,
      remainingMessages: 999999,
    };
  }

  const activeSubscription = await getActiveSubscription(req.user.id);

  if (!activeSubscription) {
    return {
      allowed: false,
      statusCode: 403,
      message: "Active subscription required to send messages.",
      messageLimit: 0,
      resetDays: 7,
      usedMessages: 0,
      remainingMessages: 0,
    };
  }

  if (activeSubscription.features?.in_app_messaging !== true) {
    return {
      allowed: false,
      statusCode: 403,
      message: "Your plan does not allow in-app messaging.",
      messageLimit: 0,
      resetDays: 7,
      usedMessages: 0,
      remainingMessages: 0,
    };
  }

  const features = activeSubscription.features || {};
  const messageLimit = normalizeNumber(features.message_limit, 0);
  const resetDays = normalizeNumber(features.message_reset_days, 7);

  if (messageLimit <= 0) {
    return {
      allowed: false,
      statusCode: 403,
      message: "Your plan does not include message access.",
      subscription: activeSubscription,
      messageLimit,
      resetDays,
      usedMessages: 0,
      remainingMessages: 0,
    };
  }

  if (messageLimit >= 999999) {
    return {
      allowed: true,
      subscription: activeSubscription,
      messageLimit,
      resetDays,
      usedMessages: 0,
      remainingMessages: 999999,
    };
  }

  const resetStartDate = getMessageResetStartDate(resetDays);

  const usedMessages = await getUserMessageUsage({
    userId: req.user.id,
    resetStartDate,
  });

  const remainingMessages = Math.max(messageLimit - usedMessages, 0);

  if (usedMessages >= messageLimit) {
    return {
      allowed: false,
      statusCode: 403,
      message: `Message limit reached. Your plan allows ${messageLimit} messages every ${resetDays} days.`,
      subscription: activeSubscription,
      messageLimit,
      resetDays,
      usedMessages,
      remainingMessages: 0,
    };
  }

  return {
    allowed: true,
    subscription: activeSubscription,
    messageLimit,
    resetDays,
    usedMessages,
    remainingMessages,
  };
};

export const createAcceptedAppointmentConnection = async ({
  booking,
  requestMessage = "",
  responseMessage = "Appointment booked. Conversation is now available.",
}) => {
  if (!booking?._id) return null;

  const existingConnection = await Connection.findOne({
    sourceType: "booking",
    booking: booking._id,
  });

  if (existingConnection) {
    if (existingConnection.status !== "accepted") {
      existingConnection.status = "accepted";
      existingConnection.acceptedAt = new Date();
      existingConnection.rejectedAt = null;
      existingConnection.cancelledAt = null;
      existingConnection.blockedAt = null;
      existingConnection.responseMessage = responseMessage;
      await existingConnection.save();
    }

    return existingConnection;
  }

  return Connection.create({
    client: booking.client,
    lawyer: booking.lawyer,
    post: null,
    booking: booking._id,
    sourceType: "booking",
    requestedBy: booking.client,
    requestMessage:
      String(requestMessage || booking.message || "").trim() ||
      "Appointment booking request.",
    responseMessage,
    status: "accepted",
    acceptedAt: new Date(),
    rejectedAt: null,
    cancelledAt: null,
    blockedAt: null,
    lastMessageAt: null,
  });
};

// =========================
// USER: CREATE POST-BASED CONNECTION REQUEST
// =========================

export const createConnectionRequest = async (req, res, next) => {
  try {
    const { clientId, lawyerId, postId, requestMessage = "" } = req.body;

    if (!["client", "lawyer"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only client or lawyer can create connection request",
      });
    }

    const currentLawyerApproved = await ensureCurrentLawyerApproved(req, res);
    if (!currentLawyerApproved) return;

    if (!postId || !isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Valid postId is required",
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Connection request is allowed only for open posts",
      });
    }

    let finalClientId = null;
    let finalLawyerId = null;

    if (req.user.role === "lawyer") {
      finalLawyerId = req.user.id;
      finalClientId = clientId || post.client;
    }

    if (req.user.role === "client") {
      finalClientId = req.user.id;

      if (!lawyerId || !isValidObjectId(lawyerId)) {
        return res.status(400).json({
          success: false,
          message: "Valid lawyerId is required",
        });
      }

      finalLawyerId = lawyerId;
    }

    if (String(post.client) !== String(finalClientId)) {
      return res.status(403).json({
        success: false,
        message: "This post does not belong to the selected client",
      });
    }

    if (String(finalClientId) === String(finalLawyerId)) {
      return res.status(400).json({
        success: false,
        message: "Client and lawyer cannot be the same user",
      });
    }

    const selectedLawyerApproved = await ensureSelectedLawyerApproved(
      finalLawyerId,
      res
    );
    if (!selectedLawyerApproved) return;

    const client = await User.findOne({
      _id: finalClientId,
      role: "client",
    }).select("_id role name email");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const existingConnection = await Connection.findOne({
      sourceType: "post",
      client: finalClientId,
      lawyer: finalLawyerId,
      post: post._id,
    });

    if (existingConnection) {
      return res.status(409).json({
        success: false,
        message: "Connection request already exists",
        data: existingConnection,
      });
    }

    const connection = await Connection.create({
      client: finalClientId,
      lawyer: finalLawyerId,
      post: post._id,
      booking: null,
      sourceType: "post",
      requestedBy: req.user.id,
      requestMessage: String(requestMessage || "").trim(),
      status: "pending",
    });

    const result = await populateConnection(Connection.findById(connection._id));

    return res.status(201).json({
      success: true,
      message: "Connection request sent successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// ADMIN: CREATE CONNECTION
// =========================

export const adminCreateConnection = async (req, res, next) => {
  try {
    const {
      clientId,
      lawyerId,
      postId,
      bookingId,
      sourceType = "post",
      requestedBy,
      requestMessage = "",
      responseMessage = "",
      status = "pending",
    } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can create connection manually",
      });
    }

    if (!["post", "booking"].includes(sourceType)) {
      return res.status(400).json({
        success: false,
        message: "sourceType must be post or booking",
      });
    }

    if (
      !["pending", "accepted", "rejected", "cancelled", "blocked"].includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection status",
      });
    }

    let finalClientId = clientId;
    let finalLawyerId = lawyerId;
    let finalPostId = null;
    let finalBookingId = null;

    if (sourceType === "post") {
      if (!clientId || !isValidObjectId(clientId)) {
        return res.status(400).json({
          success: false,
          message: "Valid clientId is required",
        });
      }

      if (!lawyerId || !isValidObjectId(lawyerId)) {
        return res.status(400).json({
          success: false,
          message: "Valid lawyerId is required",
        });
      }

      if (!postId || !isValidObjectId(postId)) {
        return res.status(400).json({
          success: false,
          message: "Valid postId is required for post connection",
        });
      }

      const [client, lawyer, post] = await Promise.all([
        User.findOne({ _id: clientId, role: "client" }).select(
          "_id role name email"
        ),
        User.findOne({ _id: lawyerId, role: "lawyer" }).select(
          "_id role name email phoneVerified profileCompleted isVerifiedLawyer"
        ),
        Post.findById(postId),
      ]);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client not found",
        });
      }

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: "Lawyer not found",
        });
      }

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (String(post.client) !== String(clientId)) {
        return res.status(400).json({
          success: false,
          message: "This post does not belong to the selected client",
        });
      }

      finalPostId = post._id;
    }

    if (sourceType === "booking") {
      if (!bookingId || !isValidObjectId(bookingId)) {
        return res.status(400).json({
          success: false,
          message: "Valid bookingId is required for appointment connection",
        });
      }

      const booking = await ConsultationBooking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      finalClientId = booking.client;
      finalLawyerId = booking.lawyer;
      finalBookingId = booking._id;
    }

    if (String(finalClientId) === String(finalLawyerId)) {
      return res.status(400).json({
        success: false,
        message: "Client and lawyer cannot be the same user",
      });
    }

    const duplicateQuery =
      sourceType === "post"
        ? {
            sourceType: "post",
            client: finalClientId,
            lawyer: finalLawyerId,
            post: finalPostId,
          }
        : {
            sourceType: "booking",
            client: finalClientId,
            lawyer: finalLawyerId,
            booking: finalBookingId,
          };

    const existingConnection = await Connection.findOne(duplicateQuery);

    if (existingConnection) {
      return res.status(409).json({
        success: false,
        message: "Connection already exists for this source",
        data: existingConnection,
      });
    }

    const now = new Date();

    const connection = await Connection.create({
      client: finalClientId,
      lawyer: finalLawyerId,
      post: sourceType === "post" ? finalPostId : null,
      booking: sourceType === "booking" ? finalBookingId : null,
      sourceType,
      requestedBy:
        requestedBy && isValidObjectId(requestedBy) ? requestedBy : req.user.id,
      requestMessage: String(requestMessage || "").trim(),
      responseMessage: String(responseMessage || "").trim(),
      status,
      acceptedAt: status === "accepted" ? now : null,
      rejectedAt: status === "rejected" ? now : null,
      cancelledAt: status === "cancelled" ? now : null,
      blockedAt: status === "blocked" ? now : null,
      lastMessageAt: null,
    });

    const result = await populateConnection(Connection.findById(connection._id));

    return res.status(201).json({
      success: true,
      message: "Connection created successfully by admin",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// READ CONNECTIONS
// =========================

export const getMyConnections = async (req, res, next) => {
  try {
    const currentLawyerApproved = await ensureCurrentLawyerApproved(req, res);
    if (!currentLawyerApproved) return;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const filter = buildConnectionFilter(req);

    const [connections, total] = await Promise.all([
      populateConnection(
        Connection.find(filter)
          .sort({ lastMessageAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
      ),
      Connection.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Connections fetched successfully",
      total,
      page,
      limit,
      data: connections,
    });
  } catch (error) {
    next(error);
  }
};

export const getConnectionById = async (req, res, next) => {
  try {
    const currentLawyerApproved = await ensureCurrentLawyerApproved(req, res);
    if (!currentLawyerApproved) return;

    const { connectionId } = req.params;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await populateConnection(Connection.findById(connectionId));

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (!canAccessConnection(req, connection)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this connection",
      });
    }

    if (req.user.role !== "admin") {
      const connectionLawyerApproved = await ensureConnectionLawyerApproved(
        connection,
        res
      );
      if (!connectionLawyerApproved) return;
    }

    return res.status(200).json({
      success: true,
      message: "Connection fetched successfully",
      data: connection,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// ADMIN: UPDATE CONNECTION
// =========================

export const adminUpdateConnection = async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const {
      clientId,
      lawyerId,
      postId,
      bookingId,
      sourceType,
      requestedBy,
      requestMessage,
      responseMessage,
      status,
    } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update connection",
      });
    }

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    const finalSourceType = sourceType || connection.sourceType || "post";

    if (!["post", "booking"].includes(finalSourceType)) {
      return res.status(400).json({
        success: false,
        message: "sourceType must be post or booking",
      });
    }

    let finalClientId = clientId || connection.client;
    let finalLawyerId = lawyerId || connection.lawyer;
    let finalPostId = null;
    let finalBookingId = null;

    if (finalSourceType === "post") {
      finalPostId = postId || connection.post;

      if (!isValidObjectId(finalClientId)) {
        return res.status(400).json({
          success: false,
          message: "Valid clientId is required",
        });
      }

      if (!isValidObjectId(finalLawyerId)) {
        return res.status(400).json({
          success: false,
          message: "Valid lawyerId is required",
        });
      }

      if (!isValidObjectId(finalPostId)) {
        return res.status(400).json({
          success: false,
          message: "Valid postId is required for post connection",
        });
      }

      const [client, lawyer, post] = await Promise.all([
        User.findOne({ _id: finalClientId, role: "client" }).select(
          "_id role name email"
        ),
        User.findOne({ _id: finalLawyerId, role: "lawyer" }).select(
          "_id role name email"
        ),
        Post.findById(finalPostId),
      ]);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client not found",
        });
      }

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: "Lawyer not found",
        });
      }

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (String(post.client) !== String(finalClientId)) {
        return res.status(400).json({
          success: false,
          message: "This post does not belong to the selected client",
        });
      }
    }

    if (finalSourceType === "booking") {
      finalBookingId = bookingId || connection.booking;

      if (!isValidObjectId(finalBookingId)) {
        return res.status(400).json({
          success: false,
          message: "Valid bookingId is required for appointment connection",
        });
      }

      const booking = await ConsultationBooking.findById(finalBookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      finalClientId = booking.client;
      finalLawyerId = booking.lawyer;
    }

    if (String(finalClientId) === String(finalLawyerId)) {
      return res.status(400).json({
        success: false,
        message: "Client and lawyer cannot be the same user",
      });
    }

    if (
      status &&
      !["pending", "accepted", "rejected", "cancelled", "blocked"].includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection status",
      });
    }

    const duplicateQuery =
      finalSourceType === "post"
        ? {
            _id: { $ne: connection._id },
            sourceType: "post",
            client: finalClientId,
            lawyer: finalLawyerId,
            post: finalPostId,
          }
        : {
            _id: { $ne: connection._id },
            sourceType: "booking",
            client: finalClientId,
            lawyer: finalLawyerId,
            booking: finalBookingId,
          };

    const duplicateConnection = await Connection.findOne(duplicateQuery);

    if (duplicateConnection) {
      return res.status(409).json({
        success: false,
        message: "Another connection already exists for this source",
      });
    }

    const now = new Date();

    connection.client = finalClientId;
    connection.lawyer = finalLawyerId;
    connection.sourceType = finalSourceType;
    connection.post = finalSourceType === "post" ? finalPostId : null;
    connection.booking = finalSourceType === "booking" ? finalBookingId : null;

    if (requestedBy && isValidObjectId(requestedBy)) {
      connection.requestedBy = requestedBy;
    }

    if (requestMessage !== undefined) {
      connection.requestMessage = String(requestMessage || "").trim();
    }

    if (responseMessage !== undefined) {
      connection.responseMessage = String(responseMessage || "").trim();
    }

    if (status && status !== connection.status) {
      connection.status = status;
      connection.acceptedAt = status === "accepted" ? now : null;
      connection.rejectedAt = status === "rejected" ? now : null;
      connection.cancelledAt = status === "cancelled" ? now : null;
      connection.blockedAt = status === "blocked" ? now : null;
    }

    await connection.save();

    const result = await populateConnection(Connection.findById(connection._id));

    return res.status(200).json({
      success: true,
      message: "Connection updated successfully by admin",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// STATUS ACTIONS
// =========================

export const acceptConnectionRequest = async (req, res, next) => {
  try {
    const currentLawyerApproved = await ensureCurrentLawyerApproved(req, res);
    if (!currentLawyerApproved) return;

    const { connectionId } = req.params;
    const { responseMessage = "" } = req.body;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (req.user.role !== "admin") {
      const connectionLawyerApproved = await ensureConnectionLawyerApproved(
        connection,
        res
      );
      if (!connectionLawyerApproved) return;
    }

    if (!canRespondConnection(req, connection)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to accept this request",
      });
    }

    if (connection.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending request can be accepted. Current status: ${connection.status}`,
      });
    }

    const now = new Date();

    connection.status = "accepted";
    connection.acceptedAt = now;
    connection.rejectedAt = null;
    connection.cancelledAt = null;
    connection.blockedAt = null;
    connection.responseMessage = String(responseMessage || "").trim();

    await connection.save();

    const result = await populateConnection(Connection.findById(connection._id));

    return res.status(200).json({
      success: true,
      message:
        "Connection request accepted successfully. Conversation is now available.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectConnectionRequest = async (req, res, next) => {
  try {
    const currentLawyerApproved = await ensureCurrentLawyerApproved(req, res);
    if (!currentLawyerApproved) return;

    const { connectionId } = req.params;
    const { responseMessage = "" } = req.body;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (req.user.role !== "admin") {
      const connectionLawyerApproved = await ensureConnectionLawyerApproved(
        connection,
        res
      );
      if (!connectionLawyerApproved) return;
    }

    if (!canRespondConnection(req, connection)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to reject this request",
      });
    }

    if (connection.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending request can be rejected. Current status: ${connection.status}`,
      });
    }

    connection.status = "rejected";
    connection.rejectedAt = new Date();
    connection.responseMessage = String(responseMessage || "").trim();

    await connection.save();

    const result = await populateConnection(Connection.findById(connection._id));

    return res.status(200).json({
      success: true,
      message: "Connection request rejected successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelConnectionRequest = async (req, res, next) => {
  try {
    const currentLawyerApproved = await ensureCurrentLawyerApproved(req, res);
    if (!currentLawyerApproved) return;

    const { connectionId } = req.params;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (req.user.role !== "admin") {
      const connectionLawyerApproved = await ensureConnectionLawyerApproved(
        connection,
        res
      );
      if (!connectionLawyerApproved) return;
    }

    if (
      req.user.role !== "admin" &&
      String(connection.requestedBy) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only requester can cancel this request",
      });
    }

    if (connection.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending request can be cancelled. Current status: ${connection.status}`,
      });
    }

    connection.status = "cancelled";
    connection.cancelledAt = new Date();

    await connection.save();

    const result = await populateConnection(Connection.findById(connection._id));

    return res.status(200).json({
      success: true,
      message: "Connection request cancelled successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// MESSAGES
// =========================

export const sendConnectionMessage = async (req, res, next) => {
  try {
    const currentLawyerApproved = await ensureCurrentLawyerApproved(req, res);
    if (!currentLawyerApproved) return;

    const { connectionId } = req.params;
    const { message, attachments } = req.body;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (!canAccessConnection(req, connection)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to message in this connection",
      });
    }

    if (req.user.role !== "admin") {
      const connectionLawyerApproved = await ensureConnectionLawyerApproved(
        connection,
        res
      );
      if (!connectionLawyerApproved) return;
    }

    if (connection.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Messaging is available only after connection is accepted",
      });
    }

    const messageLimitAccess = await checkMessageLimitAccess(req);

    if (!messageLimitAccess.allowed) {
      return res.status(messageLimitAccess.statusCode || 403).json({
        success: false,
        message: messageLimitAccess.message,
        meta: {
          messageLimit: messageLimitAccess.messageLimit || 0,
          messageResetDays: messageLimitAccess.resetDays || 7,
          usedMessages: messageLimitAccess.usedMessages || 0,
          remainingMessages: messageLimitAccess.remainingMessages || 0,
        },
      });
    }

    connection.messages.push({
      sender: req.user.id,
      message: String(message).trim(),
      attachments: normalizeAttachments(attachments),
      readBy: [req.user.id],
    });

    connection.lastMessageAt = new Date();

    await connection.save();

    const result = await populateConnection(Connection.findById(connection._id));
    const latestMessage = result.messages[result.messages.length - 1];

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        connection: result,
        message: latestMessage,
      },
      meta: {
        messageLimit: messageLimitAccess.messageLimit,
        messageResetDays: messageLimitAccess.resetDays,
        usedMessages:
          messageLimitAccess.messageLimit >= 999999
            ? messageLimitAccess.usedMessages
            : messageLimitAccess.usedMessages + 1,
        remainingMessages:
          messageLimitAccess.messageLimit >= 999999
            ? 999999
            : Math.max(messageLimitAccess.remainingMessages - 1, 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getConnectionMessages = async (req, res, next) => {
  try {
    const currentLawyerApproved = await ensureCurrentLawyerApproved(req, res);
    if (!currentLawyerApproved) return;

    const { connectionId } = req.params;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await populateConnection(Connection.findById(connectionId));

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (!canAccessConnection(req, connection)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view messages",
      });
    }

    if (req.user.role !== "admin") {
      const connectionLawyerApproved = await ensureConnectionLawyerApproved(
        connection,
        res
      );
      if (!connectionLawyerApproved) return;
    }

    if (connection.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Messages are available only after connection is accepted",
      });
    }

    const allowedMessaging = await ensureMessagingAllowed(req);

    if (!allowedMessaging) {
      return res.status(403).json({
        success: false,
        message: "Your plan does not allow in-app messaging.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Messages fetched successfully",
      data: connection.messages,
    });
  } catch (error) {
    next(error);
  }
};

export const markConnectionMessagesAsRead = async (req, res, next) => {
  try {
    const currentLawyerApproved = await ensureCurrentLawyerApproved(req, res);
    if (!currentLawyerApproved) return;

    const { connectionId } = req.params;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (!canAccessConnection(req, connection)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update messages",
      });
    }

    if (req.user.role !== "admin") {
      const connectionLawyerApproved = await ensureConnectionLawyerApproved(
        connection,
        res
      );
      if (!connectionLawyerApproved) return;
    }

    if (connection.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message:
          "Messages can be marked as read only after connection is accepted",
      });
    }

    const allowedMessaging = await ensureMessagingAllowed(req);

    if (!allowedMessaging) {
      return res.status(403).json({
        success: false,
        message: "Your plan does not allow in-app messaging.",
      });
    }

    connection.messages.forEach((item) => {
      const alreadyRead = item.readBy.some(
        (readerId) => String(readerId) === String(req.user.id)
      );

      if (!alreadyRead) {
        item.readBy.push(req.user.id);
      }
    });

    await connection.save();

    const result = await populateConnection(Connection.findById(connection._id));

    return res.status(200).json({
      success: true,
      message: "Messages marked as read successfully",
      data: result.messages,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// CONTACT
// =========================

export const getConnectionContactDetails = async (req, res, next) => {
  try {
    const currentLawyerApproved = await ensureCurrentLawyerApproved(req, res);
    if (!currentLawyerApproved) return;

    const { connectionId } = req.params;

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await populateConnection(Connection.findById(connectionId));

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    if (!canAccessConnection(req, connection)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view contact details",
      });
    }

    if (req.user.role !== "admin") {
      const connectionLawyerApproved = await ensureConnectionLawyerApproved(
        connection,
        res
      );
      if (!connectionLawyerApproved) return;
    }

    if (connection.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Contact details are available only after accepted connection",
      });
    }

    const allowedContactUnlock =
      req.user.role === "admin" ||
      (await hasBooleanFeature(req.user.id, "contact_unlock"));

    if (!allowedContactUnlock) {
      return res.status(403).json({
        success: false,
        message: "Contact unlock is a paid feature. Please upgrade your plan.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact details fetched successfully",
      data: {
        connectionId: connection._id,
        sourceType: connection.sourceType,
        post: connection.post || null,
        booking: connection.booking || null,
        client: {
          id: connection.client._id,
          name: connection.client.name,
          email: connection.client.email,
          phone: connection.client.phone,
        },
        lawyer: {
          id: connection.lawyer._id,
          name: connection.lawyer.name,
          email: connection.lawyer.email,
          phone: connection.lawyer.phone,
          lawRegNumber: connection.lawyer.lawRegNumber,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// ADMIN: DELETE CONNECTION
// =========================

export const adminDeleteConnection = async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete connection",
      });
    }

    if (!isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection id",
      });
    }

    const connection = await Connection.findByIdAndDelete(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Connection deleted successfully by admin",
    });
  } catch (error) {
    next(error);
  }
};