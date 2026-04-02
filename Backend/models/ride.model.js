const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Captain",
    },
    pickup: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    fare: {
      type: Number,
      required: true,
    },
    // Amount actually earned by captain (after admin commission)
    driverFare: {
      type: Number,
    },
    // Admin commission amount for this ride
    adminCommission: {
      type: Number,
    },
    vehicle: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "ongoing", "completed", "cancelled"],
      default: "pending",
    },
    duration: {
      type: Number,
    }, // in seconds

    distance: {
      type: Number,
    }, // in meters

    // ============================================
    // PAYMENT FIELDS - Razorpay Integration
    // ============================================
    payment: {
      // Payment status tracking
      status: {
        type: String,
        enum: ["pending", "created", "authorized", "captured", "failed", "refunded"],
        default: "pending",
      },
      // Razorpay order ID (created when user initiates payment)
      orderId: {
        type: String,
        index: true,
      },
      // Razorpay payment ID (received after successful payment)
      paymentId: {
        type: String,
        index: true,
      },
      // Razorpay signature (for verification)
      signature: {
        type: String,
      },
      // Payment method used
      method: {
        type: String,
        enum: ["card", "upi", "netbanking", "wallet", "cash", "other"],
      },
      // Amount in paise (Razorpay uses smallest currency unit)
      amount: {
        type: Number,
      },
      // Currency (default INR)
      currency: {
        type: String,
        default: "INR",
      },
      // Payment timestamp
      paidAt: {
        type: Date,
      },
      // Refund details if applicable
      refund: {
        refundId: String,
        amount: Number,
        status: String,
        refundedAt: Date,
      },
      // Error details if payment failed
      error: {
        code: String,
        description: String,
        source: String,
        step: String,
        reason: String,
      },
    },

    // Legacy fields (kept for backward compatibility)
    paymentID: {
      type: String,
    },
    orderId: {
      type: String,
    },
    signature: {
      type: String,
    },

    otp: {
      type: String,
      select: false,
      required: true,
    },
    messages: [
      {
        msg: String,
        by: {
          type: String,
          enum: ["user", "captain"],
        },
        time: String,
        date: String,
        timestamp: Date,
        _id: false
      },
    ],
  },
  { timestamps: true }
);

// Index for efficient payment queries
rideSchema.index({ "payment.status": 1 });
rideSchema.index({ "payment.orderId": 1 });

module.exports = mongoose.model("Ride", rideSchema);
