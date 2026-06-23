import mongoose from "mongoose";
import ConsultationBooking from "../models/consultationBooking.model.js";
import LawyerAvailability from "../models/lawyerAvailability.model.js";
import Connection from "../models/connection.model.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const LAWYER_NOT_APPROVED_MESSAGE =
  "This lawyer is not approved yet. Please choose a verified lawyer.";

const normalizeString = (value = "") => String(value || "").trim();

const normalizeTime = (value = "") => normalizeString(value);

const startOfDay = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const isApprovedLawyer = (lawyer) => {
  return Boolean(
    lawyer &&
      lawyer.role === "lawyer" &&
      lawyer.profileCompleted === true &&
      lawyer.phoneVerified === 1 &&
      lawyer.isVerifiedLawyer === true
  );
};

const populateBooking = (query) => {
  return query
    .populate(
      "client",
      "name email phone role subscriptionStatus currentSubscription"
    )
    .populate(
      "lawyer",
      "name email phone role lawRegNumber specialization city consultationFee profileImage phoneVerified profileCompleted isVerifiedLawyer subscriptionStatus currentSubscription"
    )
    .populate("post", "title category status budgetMin budgetMax client")
    .populate({
      path: "connection",
      populate: [
        {
          path: "client",
          select: "name email phone role",
        },
        {
          path: "lawyer",
          select: "name email phone role lawRegNumber specialization",
        },
        {
          path: "post",
          select: "title category status budgetMin budgetMax client",
        },
        {
          path: "booking",
          select:
            "client lawyer requestedDate requestedTime consultationType subject message status",
        },
        {
          path: "messages.sender",
          select: "name email role",
        },
      ],
    })
    .populate("requestedBy", "name email role")
    .populate("cancelledBy", "name email role");
};

const buildBookingFilter = (req) => {
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

  if (req.query.post && isValidObjectId(req.query.post)) {
    filter.post = req.query.post;
  }

  if (req.query.connection && isValidObjectId(req.query.connection)) {
    filter.connection = req.query.connection;
  }

  return filter;
};

const canAccessBooking = (req, booking) => {
  if (req.user.role === "admin") return true;

  const userId = String(req.user.id);

  return (
    String(booking.client?._id || booking.client) === userId ||
    String(booking.lawyer?._id || booking.lawyer) === userId
  );
};

const canLawyerOrAdminControlBooking = (req, booking) => {
  if (req.user.role === "admin") return true;

  return (
    req.user.role === "lawyer" &&
    String(booking.lawyer?._id || booking.lawyer) === String(req.user.id)
  );
};

const createAcceptedConnectionForBooking = async (booking) => {
  if (!booking?._id) {
    return null;
  }

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
    }

    existingConnection.client = booking.client;
    existingConnection.lawyer = booking.lawyer;
    existingConnection.post = null;
    existingConnection.booking = booking._id;
    existingConnection.sourceType = "booking";
    existingConnection.requestedBy = booking.client;
    existingConnection.requestMessage =
      existingConnection.requestMessage ||
      booking.message ||
      "Appointment booking request.";
    existingConnection.responseMessage =
      existingConnection.responseMessage ||
      "Appointment booked. Conversation is now available.";

    await existingConnection.save();

    return existingConnection;
  }

  return Connection.create({
    client: booking.client,
    lawyer: booking.lawyer,
    post: null,
    booking: booking._id,
    sourceType: "booking",
    requestedBy: booking.client,
    requestMessage: booking.message || "Appointment booking request.",
    responseMessage: "Appointment booked. Conversation is now available.",
    status: "accepted",
    acceptedAt: new Date(),
    rejectedAt: null,
    cancelledAt: null,
    blockedAt: null,
    lastMessageAt: null,
  });
};

const findExistingBookingForSameClientSlot = async ({
  clientId,
  lawyerId,
  requestedDate,
  requestedTime,
}) => {
  if (!clientId || !lawyerId || !requestedDate || !requestedTime) {
    return null;
  }

  if (!isValidObjectId(lawyerId)) {
    return null;
  }

  const dateValue = startOfDay(requestedDate);

  if (!dateValue) {
    return null;
  }

  const timeValue = normalizeTime(requestedTime);

  return ConsultationBooking.findOne({
    client: clientId,
    lawyer: lawyerId,
    requestedDate: dateValue,
    requestedTime: timeValue,
    status: { $in: ["pending", "accepted"] },
  });
};

export const returnExistingBookingIfSameClient = async (req, res, next) => {
  try {
    const { lawyerId, requestedDate, requestedTime } = req.body;

    const existingBooking = await findExistingBookingForSameClientSlot({
      clientId: req.user.id,
      lawyerId,
      requestedDate,
      requestedTime,
    });

    if (!existingBooking) {
      return next();
    }

    const result = await populateBooking(
      ConsultationBooking.findById(existingBooking._id)
    );

    return res.status(200).json({
      success: true,
      message: "Appointment already booked successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const checkLawyerSlotAvailability = async ({
  lawyerId,
  clientId,
  requestedDate,
  requestedTime,
  consultationType,
}) => {
  const dateValue = startOfDay(requestedDate);

  if (!dateValue) {
    return {
      allowed: false,
      status: 400,
      message: "Invalid requestedDate",
    };
  }

  const timeValue = normalizeTime(requestedTime);

  const availability = await LawyerAvailability.findOne({
    lawyer: lawyerId,
    date: dateValue,
    isActive: true,
  });

  if (!availability) {
    return {
      allowed: false,
      status: 400,
      message: "This lawyer is not available on this date",
    };
  }

  const slot = availability.slots.find(
    (item) => normalizeTime(item.time) === timeValue
  );

  if (!slot) {
    return {
      allowed: false,
      status: 400,
      message: "This time slot is not available for this lawyer",
    };
  }

  if (slot.status !== "available") {
    return {
      allowed: false,
      status: 400,
      message: "This time slot is blocked by the lawyer",
    };
  }

  if (
    Array.isArray(slot.consultationTypes) &&
    slot.consultationTypes.length > 0 &&
    !slot.consultationTypes.includes(consultationType)
  ) {
    return {
      allowed: false,
      status: 400,
      message: `This slot does not support ${consultationType} consultation`,
    };
  }

  const alreadyBooked = await ConsultationBooking.findOne({
    lawyer: lawyerId,
    requestedDate: dateValue,
    requestedTime: timeValue,
    status: { $in: ["pending", "accepted"] },
  });

  if (alreadyBooked) {
    const bookedBySameClient =
      String(alreadyBooked.client) === String(clientId);

    if (bookedBySameClient) {
      return {
        allowed: false,
        status: 200,
        alreadyBookedByMe: true,
        message: "Appointment already booked successfully.",
        data: alreadyBooked,
      };
    }

    return {
      allowed: false,
      status: 409,
      message: "This time slot is already booked. Please choose another time.",
      data: alreadyBooked,
    };
  }

  return {
    allowed: true,
    dateValue,
    timeValue,
  };
};

// =========================
// CLIENT: CREATE AUTO-ACCEPTED BOOKING
// =========================

export const createConsultationBooking = async (req, res, next) => {
  try {
    const {
      lawyerId,
      postId,
      requestedDate,
      requestedTime,
      consultationType = "online",
      subject,
      message = "",
    } = req.body;

    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        message: "Only clients can book appointments",
      });
    }

    if (!lawyerId || !isValidObjectId(lawyerId)) {
      return res.status(400).json({
        success: false,
        message: "Valid lawyerId is required",
      });
    }

    if (!requestedDate || !requestedTime || !subject) {
      return res.status(400).json({
        success: false,
        message: "requestedDate, requestedTime and subject are required",
      });
    }

    if (!["online", "in_person", "phone"].includes(consultationType)) {
      return res.status(400).json({
        success: false,
        message: "consultationType must be online, in_person or phone",
      });
    }

    const lawyer = await User.findOne({
      _id: lawyerId,
      role: "lawyer",
    }).select(
      "_id role name email phoneVerified profileCompleted isVerifiedLawyer"
    );

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Lawyer not found",
      });
    }

    if (!isApprovedLawyer(lawyer)) {
      return res.status(403).json({
        success: false,
        message: LAWYER_NOT_APPROVED_MESSAGE,
      });
    }

    let finalPostId = null;

    if (postId) {
      if (!isValidObjectId(postId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid postId",
        });
      }

      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (String(post.client) !== String(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: "You can only attach your own case post",
        });
      }

      finalPostId = post._id;
    }

    const slotCheck = await checkLawyerSlotAvailability({
      lawyerId,
      clientId: req.user.id,
      requestedDate,
      requestedTime,
      consultationType,
    });

    if (!slotCheck.allowed) {
      if (slotCheck.alreadyBookedByMe && slotCheck.data?._id) {
        const existingBooking = await populateBooking(
          ConsultationBooking.findById(slotCheck.data._id)
        );

        return res.status(200).json({
          success: true,
          message: "Appointment already booked successfully.",
          data: existingBooking,
        });
      }

      return res.status(slotCheck.status).json({
        success: false,
        message: slotCheck.message,
        data: slotCheck.data || null,
      });
    }

    const now = new Date();

    const booking = await ConsultationBooking.create({
      client: req.user.id,
      lawyer: lawyerId,
      post: finalPostId,
      connection: null,
      requestedBy: req.user.id,
      requestedDate: slotCheck.dateValue,
      requestedTime: slotCheck.timeValue,
      consultationType,
      subject: normalizeString(subject),
      message: normalizeString(message),
      status: "accepted",
      acceptedAt: now,
      rejectedAt: null,
      cancelledAt: null,
      completedAt: null,
    });

    const connection = await createAcceptedConnectionForBooking(booking);

    if (connection?._id) {
      booking.connection = connection._id;
      booking.responseMessage = "Appointment booked. Conversation is now available.";
    } else {
      booking.connection = null;
      booking.responseMessage = "Appointment booked successfully.";
    }

    await booking.save();

    const result = await populateBooking(
      ConsultationBooking.findById(booking._id)
    );

    return res.status(201).json({
      success: true,
      message: connection?._id
        ? "Appointment booked successfully. Conversation is now available."
        : "Appointment booked successfully.",
      data: result,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const existingBooking = await findExistingBookingForSameClientSlot({
        clientId: req.user.id,
        lawyerId: req.body.lawyerId,
        requestedDate: req.body.requestedDate,
        requestedTime: req.body.requestedTime,
      });

      if (existingBooking) {
        const result = await populateBooking(
          ConsultationBooking.findById(existingBooking._id)
        );

        return res.status(200).json({
          success: true,
          message: "Appointment already booked successfully.",
          data: result,
        });
      }

      return res.status(409).json({
        success: false,
        message: "This time slot is already booked. Please choose another time.",
      });
    }

    next(error);
  }
};

// =========================
// READ BOOKINGS
// =========================

export const getMyConsultationBookings = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const filter = buildBookingFilter(req);

    const [bookings, total] = await Promise.all([
      populateBooking(
        ConsultationBooking.find(filter)
          .sort({ requestedDate: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
      ),
      ConsultationBooking.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      total,
      page,
      limit,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const getConsultationBookingById = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id",
      });
    }

    const booking = await populateBooking(
      ConsultationBooking.findById(bookingId)
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!canAccessBooking(req, booking)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this booking",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking fetched successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// LEGACY: ACCEPT / REJECT OLD PENDING BOOKINGS
// =========================

export const acceptConsultationBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { responseMessage = "" } = req.body;

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id",
      });
    }

    const booking = await ConsultationBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!canLawyerOrAdminControlBooking(req, booking)) {
      return res.status(403).json({
        success: false,
        message: "Only the selected lawyer or admin can accept this booking",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending booking can be accepted. Current status: ${booking.status}`,
      });
    }

    booking.status = "accepted";
    booking.acceptedAt = new Date();
    booking.rejectedAt = null;
    booking.cancelledAt = null;

    await booking.save();

    const connection = await createAcceptedConnectionForBooking(booking);

    booking.connection = connection?._id || null;
    booking.responseMessage =
      normalizeString(responseMessage) ||
      (connection?._id
        ? "Booking accepted. Conversation is now available."
        : "Booking accepted successfully.");

    await booking.save();

    const result = await populateBooking(
      ConsultationBooking.findById(booking._id)
    );

    return res.status(200).json({
      success: true,
      message: connection?._id
        ? "Booking accepted successfully. Conversation is now available."
        : "Booking accepted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectConsultationBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { responseMessage = "" } = req.body;

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id",
      });
    }

    const booking = await ConsultationBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!canLawyerOrAdminControlBooking(req, booking)) {
      return res.status(403).json({
        success: false,
        message: "Only the selected lawyer or admin can reject this booking",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending booking can be rejected. Current status: ${booking.status}`,
      });
    }

    booking.status = "rejected";
    booking.rejectedAt = new Date();
    booking.responseMessage = normalizeString(responseMessage);

    await booking.save();

    const result = await populateBooking(
      ConsultationBooking.findById(booking._id)
    );

    return res.status(200).json({
      success: true,
      message: "Booking rejected successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// CANCEL / COMPLETE
// =========================

export const cancelConsultationBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { cancelReason = "" } = req.body;

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id",
      });
    }

    const booking = await ConsultationBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!canAccessBooking(req, booking)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to cancel this booking",
      });
    }

    if (!["pending", "accepted"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Only pending or accepted booking can be cancelled. Current status: ${booking.status}`,
      });
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user.id;
    booking.cancelReason = normalizeString(cancelReason);

    await booking.save();

    const result = await populateBooking(
      ConsultationBooking.findById(booking._id)
    );

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const completeConsultationBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id",
      });
    }

    const booking = await ConsultationBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!canLawyerOrAdminControlBooking(req, booking)) {
      return res.status(403).json({
        success: false,
        message: "Only lawyer or admin can complete this booking",
      });
    }

    if (booking.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: `Only accepted booking can be completed. Current status: ${booking.status}`,
      });
    }

    booking.status = "completed";
    booking.completedAt = new Date();

    await booking.save();

    const result = await populateBooking(
      ConsultationBooking.findById(booking._id)
    );

    return res.status(200).json({
      success: true,
      message: "Booking completed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// ADMIN
// =========================

export const adminDeleteConsultationBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete booking",
      });
    }

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id",
      });
    }

    const booking = await ConsultationBooking.findByIdAndDelete(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};