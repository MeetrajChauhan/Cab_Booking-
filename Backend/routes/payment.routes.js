/**
 * Payment Routes
 * 
 * All payment-related endpoints for the Quick Ride app
 */

const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const paymentController = require("../controllers/payment.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Middleware to validate payment data
const validatePayment = [
  body("razorpay_order_id").notEmpty().withMessage("Order ID is required"),
  body("razorpay_payment_id").notEmpty().withMessage("Payment ID is required"),
  body("razorpay_signature").notEmpty().withMessage("Signature is required"),
];

// Middleware to validate ride ID
const validateRideId = [
  body("rideId").isMongoId().withMessage("Invalid ride ID"),
];

// Middleware to validate refund
const validateRefund = [
  body("rideId").isMongoId().withMessage("Invalid ride ID"),
  body("amount").optional().isFloat({ min: 1 }).withMessage("Amount must be a positive number"),
];

/**
 * GET /payment/key
 * Get Razorpay public key for frontend
 * No authentication required
 */
router.get("/key", paymentController.getKey);

/**
 * POST /payment/create-order
 * Create a Razorpay order for a ride
 * 
 * Auth: User
 * Body: { rideId: string }
 */
router.post(
  "/create-order",
  authMiddleware.authUser,
  validateRideId,
  paymentController.createOrder
);

/**
 * POST /payment/verify
 * Verify payment signature and process successful payment
 * 
 * Auth: User
 * Body: { 
 *   razorpay_order_id: string,
 *   razorpay_payment_id: string, 
 *   razorpay_signature: string,
 *   rideId: string
 * }
 */
router.post(
  "/verify",
  authMiddleware.authUser,
  validatePayment,
  paymentController.verifyPayment
);

/**
 * POST /payment/failure
 * Handle payment failure
 * 
 * Auth: User
 * Body: { 
 *   orderId: string,
 *   error: { code, description, source, step, reason }
 * }
 */
router.post(
  "/failure",
  authMiddleware.authUser,
  paymentController.handleFailure
);

/**
 * GET /payment/status/:rideId
 * Get payment status for a ride
 * 
 * Auth: User
 * Params: rideId
 */
router.get(
  "/status/:rideId",
  authMiddleware.authUser,
  param("rideId").isMongoId().withMessage("Invalid ride ID"),
  paymentController.getPaymentStatus
);

/**
 * POST /payment/refund
 * Process refund for a ride
 * 
 * Auth: Captain
 * Body: { rideId: string, amount?: number }
 */
router.post(
  "/refund",
  authMiddleware.authCaptain,
  validateRefund,
  paymentController.processRefund
);

/**
 * POST /payment/webhook
 * Razorpay webhook handler
 * No authentication (verified via signature)
 * 
 * IMPORTANT: Configure this endpoint in Razorpay Dashboard
 * Webhook URL: https://yourdomain.com/payment/webhook
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }), // Required for webhook signature verification
  paymentController.handleWebhook
);

module.exports = router;
