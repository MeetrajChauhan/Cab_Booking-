/**
 * PaymentButton Component
 * 
 * Handles Razorpay payment integration on the frontend
 * 
 * Usage:
 * <PaymentButton 
 *   rideId={rideId}
 *   amount={fare}
 *   onPaymentSuccess={(data) => console.log("Paid:", data)}
 *   onPaymentFailure={(error) => console.log("Failed:", error)}
 * />
 */

import { useState } from "react";
import axios from "axios";
import { CheckCircle, CreditCard, XCircle, Loader2 } from "lucide-react";
// import { SocketDataContext } from "../contexts/SocketContext"; // TODO: Uncomment if using socket notifications

const PaymentButton = ({ 
  rideId, 
  amount, 
  onPaymentSuccess, 
  onPaymentFailure,
  className = ""
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // null, 'success', 'failed'
  const [orderId, setOrderId] = useState(null);
  // const { socket } = useContext(SocketDataContext); // TODO: Uncomment if using socket notifications

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Check if Razorpay is already loaded
  const isRazorpayLoaded = () => {
    return typeof window !== "undefined" && window.Razorpay;
  };

  // Create payment order on backend
  const createOrder = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/payment/create-order`,
        { rideId },
        {
          headers: {
            token: token,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Create order error:", error);
      throw error;
    }
  };

  // Handle payment success callback
  const handlePaymentSuccess = async (response) => {
    try {
      const token = localStorage.getItem("token");
      
      // Send payment verification to backend
      const verifyResponse = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/payment/verify`,
        {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          rideId: rideId,
        },
        {
          headers: {
            token: token,
          },
        }
      );

      setPaymentStatus("success");
      setLoading(false);
      
      // Notify parent component
      if (onPaymentSuccess) {
        onPaymentSuccess(verifyResponse.data);
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      handlePaymentFailure(error);
    }
  };

  // Handle payment failure callback
  const handlePaymentFailure = async (error) => {
    try {
      const token = localStorage.getItem("token");
      
      // Send failure info to backend
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/payment/failure`,
        {
          orderId: orderId,
          error: {
            code: error.error?.code || "PAYMENT_FAILED",
            description: error.error?.description || "Payment was cancelled or failed",
            source: error.error?.source || "customer",
            step: error.error?.step || "unknown",
            reason: error.error?.reason || "user_cancelled",
          },
        },
        {
          headers: {
            token: token,
          },
        }
      );
    } catch (verifyError) {
      console.error("Failed to report payment failure:", verifyError);
    }

    setPaymentStatus("failed");
    setLoading(false);
    
    // Notify parent component
    if (onPaymentFailure) {
      onPaymentFailure(error);
    }
  };

  // Main payment handler
  const handlePayment = async () => {
    setLoading(true);
    setPaymentStatus(null);

    try {
      // 1. Load Razorpay script if not already loaded
      if (!isRazorpayLoaded()) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error("Failed to load payment gateway");
        }
      }

      // 2. Create order on backend
      const orderData = await createOrder();
      setOrderId(orderData.orderId);

      // 3. Configure Razorpay options
      const options = {
        key: orderData.keyId, // Razorpay public key
        amount: orderData.amount, // Amount in paise
        currency: orderData.currency,
        name: "Quick Ride",
        description: `Ride from ${orderData.notes.pickup} to ${orderData.notes.destination}`,
        order_id: orderData.orderId, // Order ID from backend
        handler: handlePaymentSuccess, // Success callback
        modal: {
          ondismiss: () => {
            setLoading(false);
            console.log("Payment modal closed");
          },
        },
        prefill: {
          name: orderData.user?.name || "",
          email: orderData.user?.email || "",
          contact: orderData.user?.phone || "",
        },
        notes: {
          rideId: orderData.rideId,
          pickup: orderData.notes.pickup,
          destination: orderData.notes.destination,
          vehicleType: orderData.notes.vehicleType,
        },
        theme: {
          color: "#000000", // Black theme to match Uber style
        },
      };

      // 4. Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      
      // Set failure handler
      rzp.on("payment.failed", handlePaymentFailure);
      
      // Open payment modal
      rzp.open();
    } catch (error) {
      console.error("Payment initiation error:", error);
      setLoading(false);
      setPaymentStatus("failed");
      
      if (onPaymentFailure) {
        onPaymentFailure(error);
      }
    }
  };

  // Reset payment state
  const resetPayment = () => {
    setPaymentStatus(null);
    setOrderId(null);
    setLoading(false);
  };

  // Listen for payment status updates via socket
  // useEffect(() => {
  //   if (!socket) return;
  //
  //   const handlePaymentReceived = (data) => {
  //     if (data.rideId === rideId) {
  //       console.log("Payment received notification:", data);
  //       // You can update UI here if needed
  //     }
  //   };
  //
  //   socket.on("payment-received", handlePaymentReceived);
  //
  //   return () => {
  //     socket.off("payment-received", handlePaymentReceived);
  //   };
  // }, [socket, rideId]);

  // Render success state
  if (paymentStatus === "success") {
    return (
      <div className={`flex flex-col items-center gap-3 p-6 bg-green-50 rounded-xl border border-green-200 ${className}`}>
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-green-800">Payment Successful!</h3>
          <p className="text-sm text-green-600 mt-1">
            ₹{amount} has been charged to your account
          </p>
        </div>
        <button
          onClick={resetPayment}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Make Another Payment
        </button>
      </div>
    );
  }

  // Render failure state
  if (paymentStatus === "failed") {
    return (
      <div className={`flex flex-col items-center gap-3 p-6 bg-red-50 rounded-xl border border-red-200 ${className}`}>
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="w-6 h-6 text-red-600" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-red-800">Payment Failed</h3>
          <p className="text-sm text-red-600 mt-1">
            Your payment could not be processed. Please try again.
          </p>
        </div>
        <button
          onClick={resetPayment}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Render payment button
  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 px-6 py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing Payment...</span>
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          <span>Pay ₹{amount}</span>
        </>
      )}
    </button>
  );
};

export default PaymentButton;
