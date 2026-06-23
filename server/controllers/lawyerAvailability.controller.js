import mongoose from "mongoose";
import LawyerAvailability from "../models/lawyerAvailability.model.js";
import ConsultationBooking from "../models/consultationBooking.model.js";
import User from "../models/user.model.js";
import {
  canUseFeature,
  getActiveSubscription,
  getNumericFeatureValue,
} from "../utils/subscription.utils.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const CONSULTATION_TYPES = ["online", "in_person", "phone"];

const LAWYER_NOT_APPROVED_MESSAGE =
  "This lawyer is not approved yet. Please choose a verified lawyer.";

const normalizeString = (value = "") => String(value || "").trim();

const normalizeTime = (value = "") => normalizeString(value);

const startOfDay = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  date.setHours(23, 59, 59, 999);
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

const normalizeSlots = (slots = []) => {
  if (!Array.isArray(slots)) return [];

  const usedTimes = new Set();

  return slots
    .map((slot) => {
      const time = normalizeTime(slot.time);

      if (!time) return null;
      if (usedTimes.has(time)) return null;

      usedTimes.add(time);

      const consultationTypes = Array.isArray(slot.consultationTypes)
        ? slot.consultationTypes.filter((type) =>
            CONSULTATION_TYPES.includes(type)
          )
        : ["online"];

      return {
        time,
        status: slot.status === "blocked" ? "blocked" : "available",
        consultationTypes: consultationTypes.length
          ? consultationTypes
          : ["online"],
        note: normalizeString(slot.note).slice(0, 300),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.time.localeCompare(b.time));
};

const countAvailableSlots = (slots = []) => {
  if (!Array.isArray(slots)) return 0;

  return slots.filter((slot) => slot.status === "available").length;
};

const countExistingAvailabilitySlotsInSubscription = async ({
  lawyerId,
  subscription,
  excludeAvailabilityId = null,
}) => {
  if (!subscription?.startDate || !subscription?.endDate) return 0;

  const filter = {
    lawyer: lawyerId,
    isActive: true,
    date: {
      $gte: subscription.startDate,
      $lte: subscription.endDate,
    },
  };

  if (excludeAvailabilityId) {
    filter._id = { $ne: excludeAvailabilityId };
  }

  const docs = await LawyerAvailability.find(filter).select("slots");

  return docs.reduce((total, doc) => {
    return total + countAvailableSlots(doc.slots || []);
  }, 0);
};

const checkAvailabilitySubscriptionAccess = async ({
  lawyerId,
  dateValue,
  normalizedSlots,
}) => {
  const access = await canUseFeature(lawyerId, "availability_calendar_access");

  if (!access.allowed) {
    return {
      allowed: false,
      status: 403,
      message: "Your current plan does not allow availability calendar access.",
    };
  }

  const activeSubscription = await getActiveSubscription(lawyerId);

  if (!activeSubscription) {
    return {
      allowed: false,
      status: 403,
      message: "Active subscription required to manage availability.",
    };
  }

  const slotLimit = await getNumericFeatureValue(
    lawyerId,
    "availability_slot_limit",
    0
  );

  if (slotLimit <= 0) {
    return {
      allowed: false,
      status: 403,
      message: "Your current plan does not allow availability slots.",
    };
  }

  const existingAvailability = await LawyerAvailability.findOne({
    lawyer: lawyerId,
    date: dateValue,
  }).select("_id slots");

  const alreadyUsedSlots = await countExistingAvailabilitySlotsInSubscription({
    lawyerId,
    subscription: activeSubscription,
    excludeAvailabilityId: existingAvailability?._id || null,
  });

  const newSlotCount = countAvailableSlots(normalizedSlots);
  const totalAfterUpdate = alreadyUsedSlots + newSlotCount;

  if (totalAfterUpdate > slotLimit) {
    return {
      allowed: false,
      status: 403,
      message: `Your plan allows ${slotLimit} availability slots. You are trying to use ${totalAfterUpdate}.`,
    };
  }

  return {
    allowed: true,
    activeSubscription,
  };
};

const getBookedSlotsForLawyer = async ({ lawyerId, startDate, endDate }) => {
  const bookings = await ConsultationBooking.find({
    lawyer: lawyerId,
    requestedDate: {
      $gte: startDate,
      $lte: endDate,
    },
    status: { $in: ["pending", "accepted"] },
  }).select("requestedDate requestedTime status client");

  const bookedMap = new Map();

  bookings.forEach((booking) => {
    const day = startOfDay(booking.requestedDate)?.toISOString();

    if (!day) return;

    const time = normalizeTime(booking.requestedTime);
    const key = `${day}_${time}`;

    bookedMap.set(key, {
      bookingId: booking._id,
      status: booking.status,
      client: booking.client,
    });
  });

  return bookedMap;
};

const decorateAvailabilityWithBookings = async ({
  availabilityDocs,
  lawyerId,
  startDate,
  endDate,
}) => {
  const bookedMap = await getBookedSlotsForLawyer({
    lawyerId,
    startDate,
    endDate,
  });

  return availabilityDocs.map((doc) => {
    const day = startOfDay(doc.date)?.toISOString();

    const slots = (doc.slots || []).map((slot) => {
      const key = `${day}_${normalizeTime(slot.time)}`;
      const booked = bookedMap.get(key);

      return {
        time: slot.time,
        status: slot.status,
        consultationTypes: slot.consultationTypes || ["online"],
        note: slot.note || "",
        isBooked: Boolean(booked),
        bookingStatus: booked?.status || null,
        isSelectable: doc.isActive && slot.status === "available" && !booked,
      };
    });

    return {
      _id: doc._id,
      lawyer: doc.lawyer,
      date: doc.date,
      isActive: doc.isActive,
      slots,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  });
};

const cancelBookingsForDateOrSlot = async ({
  lawyerId,
  startDate,
  endDate = null,
  time = null,
  cancelledBy,
  reason = "",
}) => {
  const filter = {
    lawyer: lawyerId,
    status: { $in: ["pending", "accepted"] },
  };

  if (endDate) {
    filter.requestedDate = {
      $gte: startDate,
      $lte: endDate,
    };
  } else {
    filter.requestedDate = startDate;
  }

  if (time) {
    filter.requestedTime = normalizeTime(time);
  }

  return ConsultationBooking.updateMany(filter, {
    $set: {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy,
      cancelReason: normalizeString(reason),
    },
  });
};

// =========================
// LAWYER: CREATE / UPDATE AVAILABILITY
// =========================

export const upsertMyAvailability = async (req, res, next) => {
  try {
    const lawyerId = req.user?.id;
    const { date, slots = [], isActive = true } = req.body;

    if (req.user.role !== "lawyer") {
      return res.status(403).json({
        success: false,
        message: "Only lawyers can manage availability",
      });
    }

    const lawyer = await User.findById(lawyerId).select(
      "_id role phoneVerified profileCompleted isVerifiedLawyer"
    );

    if (!isApprovedLawyer(lawyer)) {
      return res.status(403).json({
        success: false,
        message: LAWYER_NOT_APPROVED_MESSAGE,
      });
    }

    const dateValue = startOfDay(date);

    if (!dateValue) {
      return res.status(400).json({
        success: false,
        message: "Valid date is required",
      });
    }

    const normalizedSlots = normalizeSlots(slots);

    if (!normalizedSlots.length) {
      return res.status(400).json({
        success: false,
        message: "At least one valid time slot is required",
      });
    }

    const accessCheck = await checkAvailabilitySubscriptionAccess({
      lawyerId,
      dateValue,
      normalizedSlots,
    });

    if (!accessCheck.allowed) {
      return res.status(accessCheck.status).json({
        success: false,
        message: accessCheck.message,
      });
    }

    const availability = await LawyerAvailability.findOneAndUpdate(
      {
        lawyer: lawyerId,
        date: dateValue,
      },
      {
        lawyer: lawyerId,
        date: dateValue,
        slots: normalizedSlots,
        isActive: Boolean(isActive),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Availability saved successfully",
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// LAWYER: GET OWN AVAILABILITY
// =========================

export const getMyAvailability = async (req, res, next) => {
  try {
    const lawyerId = req.user?.id;
    const { startDate, endDate } = req.query;

    if (req.user.role !== "lawyer") {
      return res.status(403).json({
        success: false,
        message: "Only lawyers can view own availability",
      });
    }

    const access = await canUseFeature(lawyerId, "availability_calendar_access");

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: "Your current plan does not allow availability calendar access.",
      });
    }

    const start = startDate ? startOfDay(startDate) : startOfDay(new Date());
    const end = endDate
      ? endOfDay(endDate)
      : endOfDay(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range",
      });
    }

    const availability = await LawyerAvailability.find({
      lawyer: lawyerId,
      date: {
        $gte: start,
        $lte: end,
      },
    }).sort({ date: 1 });

    const decorated = await decorateAvailabilityWithBookings({
      availabilityDocs: availability,
      lawyerId,
      startDate: start,
      endDate: end,
    });

    return res.status(200).json({
      success: true,
      message: "Availability fetched successfully",
      data: decorated,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// PUBLIC / CLIENT / ADMIN: GET LAWYER AVAILABILITY
// =========================

export const getLawyerAvailability = async (req, res, next) => {
  try {
    const { lawyerId } = req.params;
    const { startDate, endDate } = req.query;

    if (!isValidObjectId(lawyerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lawyer id",
      });
    }

    const lawyer = await User.findOne({
      _id: lawyerId,
      role: "lawyer",
    }).select("_id role phoneVerified profileCompleted isVerifiedLawyer");

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

    const start = startDate ? startOfDay(startDate) : startOfDay(new Date());
    const end = endDate
      ? endOfDay(endDate)
      : endOfDay(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range",
      });
    }

    const availability = await LawyerAvailability.find({
      lawyer: lawyerId,
      isActive: true,
      date: {
        $gte: start,
        $lte: end,
      },
    }).sort({ date: 1 });

    const decorated = await decorateAvailabilityWithBookings({
      availabilityDocs: availability,
      lawyerId,
      startDate: start,
      endDate: end,
    });

    return res.status(200).json({
      success: true,
      message: "Lawyer availability fetched successfully",
      data: decorated,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// LAWYER: BLOCK SPECIFIC SLOT
// =========================

export const blockMyAvailabilitySlot = async (req, res, next) => {
  try {
    const lawyerId = req.user?.id;
    const { availabilityId } = req.params;
    const { time, reason = "" } = req.body;

    if (req.user.role !== "lawyer") {
      return res.status(403).json({
        success: false,
        message: "Only lawyers can block availability slots",
      });
    }

    const access = await canUseFeature(lawyerId, "availability_calendar_access");

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: "Your current plan does not allow availability calendar access.",
      });
    }

    if (!isValidObjectId(availabilityId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability id",
      });
    }

    if (!time) {
      return res.status(400).json({
        success: false,
        message: "time is required",
      });
    }

    const availability = await LawyerAvailability.findOne({
      _id: availabilityId,
      lawyer: lawyerId,
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability not found",
      });
    }

    const selectedSlot = availability.slots.find(
      (slot) => normalizeTime(slot.time) === normalizeTime(time)
    );

    if (!selectedSlot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
      });
    }

    selectedSlot.status = "blocked";
    selectedSlot.note = normalizeString(reason) || "Blocked by lawyer";

    await availability.save();

    const cancelledBookings = await cancelBookingsForDateOrSlot({
      lawyerId,
      startDate: availability.date,
      time: selectedSlot.time,
      cancelledBy: lawyerId,
      reason: normalizeString(reason) || "Slot blocked by lawyer",
    });

    return res.status(200).json({
      success: true,
      message: "Slot blocked and related bookings cancelled successfully",
      cancelledCount: cancelledBookings.modifiedCount || 0,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// LAWYER: BLOCK FULL DAY
// =========================

export const blockMyAvailabilityDate = async (req, res, next) => {
  try {
    const lawyerId = req.user?.id;
    const { availabilityId } = req.params;
    const { reason = "" } = req.body;

    if (req.user.role !== "lawyer") {
      return res.status(403).json({
        success: false,
        message: "Only lawyers can block availability days",
      });
    }

    const access = await canUseFeature(lawyerId, "availability_calendar_access");

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: "Your current plan does not allow availability calendar access.",
      });
    }

    if (!isValidObjectId(availabilityId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability id",
      });
    }

    const availability = await LawyerAvailability.findOne({
      _id: availabilityId,
      lawyer: lawyerId,
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability not found",
      });
    }

    availability.isActive = false;
    availability.slots = availability.slots.map((slot) => ({
      time: slot.time,
      status: "blocked",
      consultationTypes: slot.consultationTypes || ["online"],
      note: normalizeString(reason) || slot.note || "Day blocked by lawyer",
    }));

    await availability.save();

    const cancelledBookings = await cancelBookingsForDateOrSlot({
      lawyerId,
      startDate: availability.date,
      cancelledBy: lawyerId,
      reason: normalizeString(reason) || "Day blocked by lawyer",
    });

    return res.status(200).json({
      success: true,
      message: "Day blocked and related bookings cancelled successfully",
      cancelledCount: cancelledBookings.modifiedCount || 0,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// LAWYER: BLOCK DATE RANGE / WEEK
// =========================

export const blockMyAvailabilityRange = async (req, res, next) => {
  try {
    const lawyerId = req.user?.id;
    const { startDate, endDate, reason = "" } = req.body;

    if (req.user.role !== "lawyer") {
      return res.status(403).json({
        success: false,
        message: "Only lawyers can block availability range",
      });
    }

    const access = await canUseFeature(lawyerId, "availability_calendar_access");

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: "Your current plan does not allow availability calendar access.",
      });
    }

    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: "Valid startDate and endDate are required",
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "endDate cannot be before startDate",
      });
    }

    const availabilityDocs = await LawyerAvailability.find({
      lawyer: lawyerId,
      date: {
        $gte: start,
        $lte: end,
      },
    });

    for (const availability of availabilityDocs) {
      availability.isActive = false;
      availability.slots = availability.slots.map((slot) => ({
        time: slot.time,
        status: "blocked",
        consultationTypes: slot.consultationTypes || ["online"],
        note:
          normalizeString(reason) ||
          slot.note ||
          "Date range blocked by lawyer",
      }));

      await availability.save();
    }

    const cancelledBookings = await ConsultationBooking.updateMany(
      {
        lawyer: lawyerId,
        requestedDate: {
          $gte: start,
          $lte: end,
        },
        status: { $in: ["pending", "accepted"] },
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancelledBy: lawyerId,
          cancelReason:
            normalizeString(reason) || "Date range blocked by lawyer",
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Date range blocked and related bookings cancelled successfully",
      blockedDays: availabilityDocs.length,
      cancelledCount: cancelledBookings.modifiedCount || 0,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// LAWYER: DELETE FULL DATE AVAILABILITY
// =========================

export const deleteMyAvailabilityDate = async (req, res, next) => {
  try {
    const lawyerId = req.user?.id;
    const { availabilityId } = req.params;
    const { reason = "" } = req.body;

    if (req.user.role !== "lawyer") {
      return res.status(403).json({
        success: false,
        message: "Only lawyers can delete availability",
      });
    }

    const access = await canUseFeature(lawyerId, "availability_calendar_access");

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: "Your current plan does not allow availability calendar access.",
      });
    }

    if (!isValidObjectId(availabilityId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability id",
      });
    }

    const availability = await LawyerAvailability.findOne({
      _id: availabilityId,
      lawyer: lawyerId,
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability not found",
      });
    }

    await cancelBookingsForDateOrSlot({
      lawyerId,
      startDate: availability.date,
      cancelledBy: lawyerId,
      reason: normalizeString(reason) || "Availability deleted by lawyer",
    });

    await LawyerAvailability.findByIdAndDelete(availability._id);

    return res.status(200).json({
      success: true,
      message: "Availability deleted and related bookings cancelled successfully",
    });
  } catch (error) {
    next(error);
  }
};