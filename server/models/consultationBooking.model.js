import mongoose from "mongoose";

export const BOOKING_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
  "completed",
];

export const CONSULTATION_TYPES = ["online", "in_person", "phone"];

const consultationBookingSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    lawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
      index: true,
    },

    connection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Connection",
      default: null,
      index: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    requestedDate: {
      type: Date,
      required: true,
      index: true,
    },

    requestedTime: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    consultationType: {
      type: String,
      enum: CONSULTATION_TYPES,
      default: "online",
      index: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    responseMessage: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: "accepted",
      index: true,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    cancelReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

consultationBookingSchema.index({
  client: 1,
  lawyer: 1,
  requestedDate: 1,
  status: 1,
});

consultationBookingSchema.index({
  lawyer: 1,
  status: 1,
  requestedDate: 1,
});

consultationBookingSchema.index({
  client: 1,
  status: 1,
  createdAt: -1,
});

consultationBookingSchema.index(
  {
    lawyer: 1,
    requestedDate: 1,
    requestedTime: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "accepted"] },
    },
  }
);

const ConsultationBooking = mongoose.model(
  "ConsultationBooking",
  consultationBookingSchema
);

export default ConsultationBooking;