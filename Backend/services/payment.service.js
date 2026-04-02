/**
 * Payment Service - Razorpay Integration
 * 
 * This service handles all payment-related operations:
 * - Creating Razorpay orders
 * - Verifying payment signatures
 * - Processing refunds
 * - Webhook handling
 * 
 * Razorpay Test Mode:
 * - Use test API keys from Razorpay Dashboard
 * - Test card: 4111 1111 1111 1111 (any expiry, any CVV)
 * - Test UPI: success@razorpay (for successful payments)
 */

const Razorpay = require("razorpay");
const crypto = require("crypto");
const rideModel = require("../models/ride.model");

// Initialize Razorpay instance
let razorpay = null;

/**
 * Initialize Razorpay with API keys
 * Called once when service is first used
 */
const initializeRazorpay = () => {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("[Payment] ✗ Razorpay credentials not configured");
      throw new Error("Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
    }

    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    console.log("[Payment] ✓ Razorpay initialized successfully");
  }
  return razorpay;
};

/**
 * Create a Razorpay order for a ride
 * 
 * @param {string} rideId - The ride ID to create payment for
 * @returns {Promise<object>} Order details with orderId
 */
const createOrder = async (rideId) => {
  if (!rideId) {
    throw new Error("Ride ID is required");
  }

  try {
    // Get ride details
    const ride = await rideModel.findById(rideId).populate("user", "fullname email phone");
    
    if (!ride) {
      throw new Error("Ride not found");
    }

    // Check if ride is in valid state for payment
    if (ride.status === "cancelled") {
      throw new Error("Cannot create payment for cancelled ride");
    }

    // Check if payment already completed
    if (ride.payment?.status === "captured") {
      throw new Error("Payment already completed for this ride");
    }

    // Check if order already exists and is valid
    if (ride.payment?.orderId && ride.payment?.status === "created") {
      console.log(`[Payment] Order already exists for ride ${rideId}: ${ride.payment.orderId}`);
      return {
        orderId: ride.payment.orderId,
        amount: ride.payment.amount,
        currency: ride.payment.currency,
        rideId: ride._id,
      };
    }

    // Initialize Razorpay
    const rzp = initializeRazorpay();

    // Amount in paise (INR smallest unit)
    const amountInPaise = Math.round(ride.fare * 100);

    // Create Razorpay order
    const orderOptions = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `ride_${rideId}`,
      notes: {
        rideId: rideId.toString(),
        pickup: ride.pickup,
        destination: ride.destination,
        vehicleType: ride.vehicle,
        userId: ride.user._id.toString(),
        userName: `${ride.user.fullname?.firstname || ''} ${ride.user.fullname?.lastname || ''}`.trim(),
      },
    };

    console.log(`[Payment] Creating order for ride ${rideId}, amount: ₹${ride.fare}`);

    const order = await rzp.orders.create(orderOptions);

    // Update ride with order details
    await rideModel.findByIdAndUpdate(rideId, {
      "payment.orderId": order.id,
      "payment.amount": amountInPaise,
      "payment.currency": "INR",
      "payment.status": "created",
      // Legacy fields for backward compatibility
      orderId: order.id,
    });

    console.log(`[Payment] ✓ Order created: ${order.id}`);

    return {
      orderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      rideId: ride._id,
      keyId: process.env.RAZORPAY_KEY_ID, // Frontend needs this
      user: {
        name: `${ride.user.fullname?.firstname || ''} ${ride.user.fullname?.lastname || ''}`.trim(),
        email: ride.user.email,
        phone: ride.user.phone,
      },
      notes: orderOptions.notes,
    };
  } catch (error) {
    console.error(`[Payment] ✗ Create order error:`, error.message);
    throw error;
  }
};

/**
 * Verify Razorpay payment signature
 * This is CRITICAL for security - never skip this!
 * 
 * @param {object} paymentData - Payment data from Razorpay
 * @returns {boolean} True if signature is valid
 */
const verifySignature = (paymentData) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    console.error("[Payment] ✗ Missing payment verification data");
    return false;
  }

  try {
    // Generate expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    // Compare signatures
    const isValid = expectedSignature === razorpay_signature;
    
    if (isValid) {
      console.log(`[Payment] ✓ Signature verified for order ${razorpay_order_id}`);
    } else {
      console.error(`[Payment] ✗ Signature mismatch for order ${razorpay_order_id}`);
    }

    return isValid;
  } catch (error) {
    console.error("[Payment] ✗ Signature verification error:", error.message);
    return false;
  }
};

/**
 * Process successful payment
 * Called after signature verification
 * 
 * @param {object} paymentData - Verified payment data
 * @returns {Promise<object>} Updated ride details
 */
const processPayment = async (paymentData) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

  try {
    // Find ride by order ID
    const ride = await rideModel.findOne({ "payment.orderId": razorpay_order_id });
    
    if (!ride) {
      throw new Error("Ride not found for order: " + razorpay_order_id);
    }

    // Verify signature again (double-check)
    if (!verifySignature(paymentData)) {
      throw new Error("Payment signature verification failed");
    }

    // Get payment details from Razorpay
    const rzp = initializeRazorpay();
    let paymentDetails = null;
    
    try {
      paymentDetails = await rzp.payments.fetch(razorpay_payment_id);
    } catch (fetchError) {
      console.warn("[Payment] Could not fetch payment details:", fetchError.message);
    }

    // Update ride with payment details
    const updatedRide = await rideModel.findByIdAndUpdate(
      ride._id,
      {
        "payment.paymentId": razorpay_payment_id,
        "payment.signature": razorpay_signature,
        "payment.status": "captured",
        "payment.method": paymentDetails?.method || "other",
        "payment.paidAt": new Date(),
        // Legacy fields
        paymentID: razorpay_payment_id,
        signature: razorpay_signature,
      },
      { new: true }
    ).populate("user", "fullname email phone")
     .populate("captain", "fullname phone vehicle");

    console.log(`[Payment] ✓ Payment processed for ride ${ride._id}: ${razorpay_payment_id}`);

    return {
      success: true,
      message: "Payment successful",
      ride: updatedRide,
      paymentId: razorpay_payment_id,
    };
  } catch (error) {
    console.error("[Payment] ✗ Process payment error:", error.message);
    throw error;
  }
};

/**
 * Handle payment failure
 * 
 * @param {object} errorData - Error data from Razorpay
 * @param {string} orderId - Razorpay order ID
 * @returns {Promise<object>} Updated ride details
 */
const handlePaymentFailure = async (errorData, orderId) => {
  try {
    const ride = await rideModel.findOne({ "payment.orderId": orderId });
    
    if (!ride) {
      console.error(`[Payment] Ride not found for failed order: ${orderId}`);
      return null;
    }

    // Update ride with error details
    await rideModel.findByIdAndUpdate(ride._id, {
      "payment.status": "failed",
      "payment.error": {
        code: errorData.code || "UNKNOWN",
        description: errorData.description || "Payment failed",
        source: errorData.source || "unknown",
        step: errorData.step || "unknown",
        reason: errorData.reason || "unknown",
      },
    });

    console.log(`[Payment] ✗ Payment failed for ride ${ride._id}: ${errorData.description}`);

    return { success: false, message: "Payment failed", error: errorData };
  } catch (error) {
    console.error("[Payment] ✗ Handle failure error:", error.message);
    throw error;
  }
};

/**
 * Process refund for a ride
 * 
 * @param {string} rideId - Ride ID to refund
 * @param {number} amount - Amount to refund (optional, full refund if not specified)
 * @returns {Promise<object>} Refund details
 */
const processRefund = async (rideId, amount = null) => {
  try {
    const ride = await rideModel.findById(rideId);
    
    if (!ride) {
      throw new Error("Ride not found");
    }

    if (ride.payment?.status !== "captured") {
      throw new Error("Cannot refund: Payment not captured");
    }

    if (!ride.payment?.paymentId) {
      throw new Error("Cannot refund: No payment ID found");
    }

    const rzp = initializeRazorpay();

    // Calculate refund amount (in paise)
    const refundAmount = amount ? Math.round(amount * 100) : ride.payment.amount;

    // Create refund
    const refund = await rzp.payments.refund(ride.payment.paymentId, {
      amount: refundAmount,
      speed: "normal", // or "optimum" for faster refund
      notes: {
        rideId: rideId.toString(),
        reason: "Ride cancelled or disputed",
      },
    });

    // Update ride with refund details
    await rideModel.findByIdAndUpdate(rideId, {
      "payment.status": "refunded",
      "payment.refund": {
        refundId: refund.id,
        amount: refundAmount,
        status: refund.status,
        refundedAt: new Date(),
      },
    });

    console.log(`[Payment] ✓ Refund processed for ride ${rideId}: ${refund.id}`);

    return {
      success: true,
      refundId: refund.id,
      amount: refundAmount / 100,
      status: refund.status,
    };
  } catch (error) {
    console.error("[Payment] ✗ Refund error:", error.message);
    throw error;
  }
};

/**
 * Get payment status for a ride
 * 
 * @param {string} rideId - Ride ID
 * @returns {Promise<object>} Payment status details
 */
const getPaymentStatus = async (rideId) => {
  try {
    const ride = await rideModel.findById(rideId).select("payment fare");
    
    if (!ride) {
      throw new Error("Ride not found");
    }

    return {
      status: ride.payment?.status || "pending",
      orderId: ride.payment?.orderId || null,
      paymentId: ride.payment?.paymentId || null,
      amount: ride.fare,
      currency: ride.payment?.currency || "INR",
      paidAt: ride.payment?.paidAt || null,
      method: ride.payment?.method || null,
    };
  } catch (error) {
    console.error("[Payment] ✗ Get status error:", error.message);
    throw error;
  }
};

/**
 * Handle Razorpay webhook events
 * For automated payment status updates
 * 
 * @param {object} event - Webhook event data
 * @param {string} signature - Webhook signature header
 * @returns {Promise<object>} Processing result
 */
const handleWebhook = async (event, signature) => {
  try {
    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (webhookSecret) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(event))
        .digest("hex");

      if (expectedSignature !== signature) {
        console.error("[Payment] ✗ Webhook signature mismatch");
        return { success: false, message: "Invalid webhook signature" };
      }
    }

    const { event: eventType, payload } = event;
    console.log(`[Payment] Webhook received: ${eventType}`);

    switch (eventType) {
      case "payment.captured":
        // Payment successful
        const paymentEntity = payload.payment.entity;
        const orderId = paymentEntity.order_id;
        
        await rideModel.findOneAndUpdate(
          { "payment.orderId": orderId },
          {
            "payment.paymentId": paymentEntity.id,
            "payment.status": "captured",
            "payment.method": paymentEntity.method,
            "payment.paidAt": new Date(),
            paymentID: paymentEntity.id,
          }
        );
        console.log(`[Payment] ✓ Webhook: Payment captured for order ${orderId}`);
        break;

      case "payment.failed":
        // Payment failed
        const failedPayment = payload.payment.entity;
        await rideModel.findOneAndUpdate(
          { "payment.orderId": failedPayment.order_id },
          {
            "payment.status": "failed",
            "payment.error": {
              code: failedPayment.error_code,
              description: failedPayment.error_description,
              reason: failedPayment.error_reason,
            },
          }
        );
        console.log(`[Payment] ✗ Webhook: Payment failed for order ${failedPayment.order_id}`);
        break;

      case "refund.created":
        // Refund initiated
        const refundEntity = payload.refund.entity;
        console.log(`[Payment] Webhook: Refund created ${refundEntity.id}`);
        break;

      default:
        console.log(`[Payment] Webhook: Unhandled event ${eventType}`);
    }

    return { success: true, message: "Webhook processed" };
  } catch (error) {
    console.error("[Payment] ✗ Webhook error:", error.message);
    throw error;
  }
};

module.exports = {
  createOrder,
  verifySignature,
  processPayment,
  handlePaymentFailure,
  processRefund,
  getPaymentStatus,
  handleWebhook,
};
