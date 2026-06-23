import mongoose from "mongoose";

export const CONTACT_URGENCY = ["low", "normal", "high", "critical"];
export const CONTACT_STATUS = ["new", "read", "replied", "closed"];

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [80, "Name cannot exceed 80 characters"],
      index: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
      index: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
      maxlength: [30, "Phone cannot exceed 30 characters"],
      index: true,
    },

    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      minlength: [3, "Subject must be at least 3 characters"],
      maxlength: [150, "Subject cannot exceed 150 characters"],
      index: true,
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [3000, "Message cannot exceed 3000 characters"],
    },

    urgency: {
      type: String,
      enum: CONTACT_URGENCY,
      default: "normal",
      index: true,
    },

    status: {
      type: String,
      enum: CONTACT_STATUS,
      default: "new",
      index: true,
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1500, "Admin note cannot exceed 1500 characters"],
    },

    repliedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },

    userAgent: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

contactSchema.index({
  status: 1,
  urgency: 1,
  createdAt: -1,
  _id: -1,
});

contactSchema.index({
  name: "text",
  email: "text",
  phone: "text",
  subject: "text",
  message: "text",
});

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;