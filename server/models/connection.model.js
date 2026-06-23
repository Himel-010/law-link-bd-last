import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    attachments: [
      {
        type: String,
        trim: true,
      },
    ],

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const connectionSchema = new mongoose.Schema(
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

    // Case/post based connection
    // Required only when sourceType = "post"
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
      index: true,
    },

    // Appointment based connection
    // Required only when sourceType = "booking"
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConsultationBooking",
      default: null,
      index: true,
    },

    sourceType: {
      type: String,
      enum: ["post", "booking"],
      default: "post",
      index: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    requestMessage: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "blocked"],
      default: "pending",
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

    blockedAt: {
      type: Date,
      default: null,
    },

    responseMessage: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    messages: {
      type: [messageSchema],
      default: [],
    },

    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// Validate source relation
connectionSchema.pre("validate", function (next) {
  if (this.sourceType === "post" && !this.post) {
    return next(new Error("Post is required for post-based connection."));
  }

  if (this.sourceType === "booking" && !this.booking) {
    return next(new Error("Booking is required for appointment-based connection."));
  }

  if (this.sourceType === "booking") {
    this.post = null;
  }

  if (this.sourceType === "post") {
    this.booking = null;
  }

  return next();
});

// Unique post based connection
connectionSchema.index(
  {
    client: 1,
    lawyer: 1,
    post: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      sourceType: "post",
      post: { $type: "objectId" },
    },
  }
);

// Unique booking based connection
connectionSchema.index(
  {
    client: 1,
    lawyer: 1,
    booking: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      sourceType: "booking",
      booking: { $type: "objectId" },
    },
  }
);

connectionSchema.index({ client: 1, status: 1, createdAt: -1 });
connectionSchema.index({ lawyer: 1, status: 1, createdAt: -1 });
connectionSchema.index({ requestedBy: 1, createdAt: -1 });
connectionSchema.index({ post: 1, status: 1 });
connectionSchema.index({ booking: 1, status: 1 });
connectionSchema.index({ sourceType: 1, status: 1 });
connectionSchema.index({ status: 1, lastMessageAt: -1 });
connectionSchema.index({ "messages.sender": 1 });

const Connection = mongoose.model("Connection", connectionSchema);

export default Connection;