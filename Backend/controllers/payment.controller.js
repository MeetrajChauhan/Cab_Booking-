/**
 * Payment Controller
 * 
 * Handles all payment-related HTTP endpoints:
 * - POST /payment/create-order - Create Razorpay order
 * - POST /payment/verify - Verify and process payment
 * - POST /payment/failure - Handle payment failure
 * - GET /payment/status/:rideId - Get payment status
 * - POST /payment/refund - Process refund (admin only)
 * - POST /payment/webhook - Razorpay webhook handler
 */

const { validationResult } = require("express-validator");
const paymentService = require("../services/payment.service");
const rideModel = require("../models/ride.model");
const { sendMessageToSocketId } = require("../socket");

/**
 * POST /payment/create-order
 * Create a Razorpay order for a ride
 * 
 * Body: { rideId: string }
 * Response: { orderId, amount, currency, keyId, ... }
 */
module.exports.createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    // Verify user owns this ride
    const ride = await rideModel.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized: You can only pay for your own rides" });
    }

    // Create order
    const orderData = await paymentService.createOrder(rideId);

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      ...orderData,
    });
  } catch (error) {
    console.error("[Payment Controller] Create order error:", error.message);
    res.status(500).json({ 
      success: false,
      message: error.message || "Failed to create payment order" 
    });
  }
};

/**
 * POST /payment/verify
 * Verify payment signature and process successful payment
 * 
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, rideId }
 * Response: { success, message, ride, paymentId }
 */
module.exports.verifyPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, rideId } = req.body;

  try {
    // Verify signature first
    const isValid = paymentService.verifySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed: Invalid signature",
      });
    }

    // Process the payment
    const result = await paymentService.processPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    // Notify captain about successful payment via socket
    if (result.ride?.captain?.socketId) {
      // Captain's actual earning (after admin commission)
      const driverAmount = typeof result.ride.driverFare === "number"
        ? result.ride.driverFare
        : result.ride.fare;

      sendMessageToSocketId(result.ride.captain.socketId, {
        event: "payment-received",
        data: {
          rideId: result.ride._id,
          amount: driverAmount,
          paymentId: razorpay_payment_id,
          message: "Payment received from user",
        },
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("[Payment Controller] Verify payment error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
};

/**
 * POST /payment/failure
 * Handle payment failure
 * 
 * Body: { orderId, error: { code, description, source, step, reason } }
 */
module.exports.handleFailure = async (req, res) => {
  const { orderId, error } = req.body;

  try {
    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: "Order ID is required" 
      });
    }

    const result = await paymentService.handlePaymentFailure(error || {}, orderId);

    res.status(200).json({
      success: true,
      message: "Payment failure recorded",
      ...result,
    });
  } catch (error) {
    console.error("[Payment Controller] Handle failure error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to record payment failure",
    });
  }
};

/**
 * GET /payment/status/:rideId
 * Get payment status for a ride
 */
module.exports.getPaymentStatus = async (req, res) => {
  const { rideId } = req.params;

  try {
    if (!rideId) {
      return res.status(400).json({ message: "Ride ID is required" });
    }

    const status = await paymentService.getPaymentStatus(rideId);

    res.status(200).json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error("[Payment Controller] Get status error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get payment status",
    });
  }
};

/**
 * POST /payment/refund
 * Process refund for a ride (requires captain auth)
 * 
 * Body: { rideId, amount? }
 */
module.exports.processRefund = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, amount } = req.body;

  try {
    // Verify captain owns this ride
    const ride = await rideModel.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.captain?.toString() !== req.captain._id.toString()) {
      return res.status(403).json({ message: "Unauthorized: You can only refund rides you completed" });
    }

    const result = await paymentService.processRefund(rideId, amount);

    // Notify user about refund
    const rideWithUser = await rideModel.findById(rideId).populate("user", "socketId");
    if (rideWithUser?.user?.socketId) {
      sendMessageToSocketId(rideWithUser.user.socketId, {
        event: "payment-refunded",
        data: {
          rideId: ride._id,
          amount: result.amount,
          refundId: result.refundId,
          message: "Your payment has been refunded",
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      ...result,
    });
  } catch (error) {
    console.error("[Payment Controller] Refund error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process refund",
    });
  }
};

/**
 * POST /payment/webhook
 * Razorpay webhook handler
 * 
 * Receives automated updates from Razorpay about payment status changes
 */
module.exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const event = req.body;

    const result = await paymentService.handleWebhook(event, signature);

    // Always return 200 for webhooks to acknowledge receipt
    res.status(200).json(result);
  } catch (error) {
    console.error("[Payment Controller] Webhook error:", error.message);
    // Still return 200 to prevent Razorpay from retrying
    res.status(200).json({ 
      success: false, 
      message: "Webhook processing error" 
    });
  }
};

/**
 * GET /payment/key
 * Get Razorpay key ID for frontend
 * (Only returns public key, not secret)
 */
module.exports.getKey = async (req, res) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    
    if (!keyId) {
      return res.status(500).json({ 
        success: false, 
        message: "Payment gateway not configured" 
      });
    }

    res.status(200).json({
      success: true,
      keyId: keyId,
    });
  } catch (error) {
    console.error("[Payment Controller] Get key error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get payment key",
    });
  }
};
