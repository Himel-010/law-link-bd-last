import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
      index: true,
    },

    roleType: {
      type: String,
      enum: ["client", "lawyer"],
      required: true,
      index: true,
    },

    planName: {
      type: String,
      required: true,
      trim: true,
    },

    planSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "BDT",
    },

    durationInDays: {
      type: Number,
      required: true,
      min: 1,
      default: 30,
    },

    // Dynamic permission object copied from Plan.features
    // Example:
    // {
    //   case_post_limit: 5,
    //   connection_request_limit: 10,
    //   proposal_limit: 20,
    //   in_app_messaging: true,
    //   contact_unlock: false
    // }
    features: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: ["pending", "active", "expired", "cancelled"],
      default: "pending",
      index: true,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    activatedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    payment: {
      status: {
        type: String,
        enum: ["free", "unpaid", "paid", "failed", "refunded"],
        default: "unpaid",
      },

      transactionId: {
        type: String,
        trim: true,
        default: null,
      },

      method: {
        type: String,
        enum: ["bkash", "nagad", "nogod", null],
        default: null,
      },

      paidAt: {
        type: Date,
        default: null,
      },
    },

    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

subscriptionSchema.index({ user: 1, status: 1, endDate: -1 });
subscriptionSchema.index({ user: 1, roleType: 1, status: 1 });
subscriptionSchema.index({ plan: 1, status: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;