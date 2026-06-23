import mongoose from "mongoose";

export const AVAILABILITY_SLOT_STATUSES = ["available", "blocked"];

export const CONSULTATION_TYPES = ["online", "in_person", "phone"];

const availabilitySlotSchema = new mongoose.Schema(
  {
    time: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: AVAILABILITY_SLOT_STATUSES,
      default: "available",
      index: true,
    },

    consultationTypes: {
      type: [String],
      enum: CONSULTATION_TYPES,
      default: ["online"],
    },

    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },
  },
  { _id: false }
);

const lawyerAvailabilitySchema = new mongoose.Schema(
  {
    lawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    slots: {
      type: [availabilitySlotSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

lawyerAvailabilitySchema.index({ lawyer: 1, date: 1 }, { unique: true });

const LawyerAvailability = mongoose.model(
  "LawyerAvailability",
  lawyerAvailabilitySchema
);

export default LawyerAvailability;