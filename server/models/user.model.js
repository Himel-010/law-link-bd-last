import mongoose from "mongoose";

export const LAWYER_SPECIALIZATIONS = [
  "Family Law",
  "Criminal Law",
  "Property Law",
  "Corporate Law",
  "Immigration Law",
  "Employment Law",
  "Tax Law",
  "Civil Law",
  "Cyber Law",
  "Other",
];

export const LAWYER_AVAILABILITY = ["available", "busy", "offline"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    nid: {
      type: String,
      required: function () {
        return this.role === "lawyer";
      },
      trim: true,
      index: true,
    },

    lawRegNumber: {
      type: String,
      required: function () {
        return this.role === "lawyer";
      },
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      required: function () {
        return this.role !== "admin";
      },
      trim: true,
      index: true,
    },

    phoneVerified: {
      type: Number,
      enum: [0, 1],
      default: 0,
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["client", "lawyer", "admin"],
      default: "client",
      index: true,
    },

    subscriptionStatus: {
      type: String,
      enum: ["none", "pending", "active", "expired", "cancelled"],
      default: "none",
      index: true,
    },

    currentSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },

    specialization: {
      type: String,
      enum: [...LAWYER_SPECIALIZATIONS, ""],
      default: "",
      trim: true,
      index: true,
    },

    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
      max: 80,
      index: true,
    },

    profileImage: {
      type: String,
      default: "",
      trim: true,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    officeAddress: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    consultationFee: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    availability: {
      type: String,
      enum: LAWYER_AVAILABILITY,
      default: "available",
      index: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },

    casesHandled: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    isVerifiedLawyer: {
      type: Boolean,
      default: false,
      index: true,
    },

    profileCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

userSchema.index({
  role: 1,
  subscriptionStatus: 1,
  isVerifiedLawyer: -1,
  profileCompleted: -1,
  createdAt: -1,
  _id: -1,
});

userSchema.index({
  role: 1,
  specialization: 1,
  city: 1,
  availability: 1,
});

userSchema.index({
  name: "text",
  email: "text",
  phone: "text",
  lawRegNumber: "text",
  specialization: "text",
  city: "text",
  bio: "text",
});

const User = mongoose.model("User", userSchema);

export default User;