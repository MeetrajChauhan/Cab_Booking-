import {
  CreditCard,
  MapPinMinus,
  MapPinPlus,
  PhoneCall,
  ChevronLeft,
} from "lucide-react";
import Button from "./Button";
import PaymentButton from "./PaymentButton";

function RideDetails({
  pickupLocation,
  destinationLocation,
  selectedVehicle,
  fare,
  showPanel,
  setShowPanel,
  showPreviousPanel,
  createRide,
  cancelRide,
  loading,
  rideCreated,
  confirmedRideData,
  inlineMode = false,
  onBack,
}) {
  // Payment success handler
  const handlePaymentSuccess = (paymentData) => {
    console.log("Payment successful:", paymentData);
    // You can add additional logic here like showing a success message
    // or updating the UI state
  };

  // Payment failure handler
  const handlePaymentFailure = (error) => {
    console.error("Payment failed:", error);
    // You can show an error message to the user
  };

  // Inline mode - renders directly in the left panel
  if (inlineMode && showPanel) {
    return (
      <div className="space-y-4">
        {/* Back button */}
        <button
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              setShowPanel(false);
              showPreviousPanel(true);
            }
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-2"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        {rideCreated && !confirmedRideData && (
          <div className="text-center py-4 space-y-3">
            <p className="text-base font-medium text-gray-700">Looking for nearby drivers...</p>
            <div className="h-1 w-12 rounded-full bg-blue-500 animate-pulse mx-auto"></div>
          </div>
        )}

        {/* Vehicle and Captain Info */}
        <div className={`flex ${confirmedRideData ? "justify-between items-start" : "justify-center"}`}>
          <div>
            <img
              src={selectedVehicle == "car" ? "/car.png" : `/${selectedVehicle}.webp`}
              className={`${confirmedRideData ? "h-20 w-20" : "h-16 w-16"} object-contain mix-blend-multiply`}
            />
          </div>

          {confirmedRideData?._id && (
            <div className="text-right space-y-1">
              <h2 className="text-base font-bold text-gray-900">
                {confirmedRideData?.captain?.fullname?.firstname}{" "}
                {confirmedRideData?.captain?.fullname?.lastname}
              </h2>
              <p className="text-lg font-bold text-gray-900">
                {confirmedRideData?.captain?.vehicle?.number}
              </p>
              <p className="text-xs text-gray-600 capitalize">
                {confirmedRideData?.captain?.vehicle?.color}{" "}
                {confirmedRideData?.captain?.vehicle?.type}
              </p>
              {confirmedRideData?.etaToPickup && (
                <p className="text-xs text-green-700 font-medium mt-1">
                  Driver arriving in{" "}
                  <span className="font-semibold">
                    {confirmedRideData.etaToPickup.etaMinutes} min
                  </span>{" "}
                  ({confirmedRideData.etaToPickup.distanceKm} km away)
                </p>
              )}
              <div className="mt-2 inline-block bg-black text-white px-3 py-1 rounded-lg font-bold text-sm">
                OTP: {confirmedRideData?.otp}
              </div>
            </div>
          )}
        </div>

        {confirmedRideData?._id && (
          <div className="flex gap-3">
            <Button
              title={"Message"}
              size="md"
              variant="secondary"
              fullWidth={true}
            />
            <button className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors shrink-0">
              <a href={"tel:" + confirmedRideData?.captain?.phone}>
                <PhoneCall size={20} strokeWidth={2} className="text-gray-900" />
              </a>
            </button>
          </div>
        )}

        {/* Location and Fare Details */}
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-1">
              <MapPinMinus size={20} className="text-gray-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900">
                {pickupLocation.split(", ")[0]}
              </h3>
              <p className="text-sm text-gray-600 mt-1 truncate">
                {pickupLocation.split(", ").slice(1).join(", ")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-1">
              <MapPinPlus size={20} className="text-gray-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900">
                {destinationLocation.split(", ")[0]}
              </h3>
              <p className="text-sm text-gray-600 mt-1 truncate">
                {destinationLocation.split(", ").slice(1).join(", ")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 pt-2">
            <div className="shrink-0 mt-1">
              <CreditCard size={20} className="text-gray-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">
                ₹{fare[selectedVehicle]}
              </h3>
              <p className="text-sm text-gray-600 mt-1">Online payment</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-3">
          {/* Payment Button - Only show if ride is confirmed but not paid */}
          {confirmedRideData?._id && (
            <PaymentButton
              rideId={confirmedRideData._id}
              amount={fare[selectedVehicle]}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailure={handlePaymentFailure}
            />
          )}

          {/* Cancel Ride Button */}
          {(rideCreated || confirmedRideData) && (
            <Button
              title={"Cancel Ride"}
              size="md"
              variant="danger"
              fullWidth={true}
              loading={loading}
              fun={cancelRide}
            />
          )}

          {/* Confirm Ride Button */}
          {!rideCreated && !confirmedRideData && (
            <Button
              title={"Confirm Ride"}
              size="md"
              variant="primary"
              fullWidth={true}
              loading={loading}
              fun={createRide}
            />
          )}
        </div>
      </div>
    );
  }

  // Modal mode - original overlay behavior
  return (
    <>
      {/* Overlay backdrop */}
      {showPanel && (
        <div 
          className="absolute inset-0 bg-black/40 z-0 pointer-events-auto transition-opacity duration-300"
          onClick={() => {
            setShowPanel(false);
            showPreviousPanel(true);
          }}
          aria-label="Close ride details"
        />
      )}

      {/* Ride Details Panel */}
      <div
        className={`${
          showPanel ? "bottom-0 z-10 pointer-events-auto" : "-bottom-full"
        } transition-all duration-500 absolute bg-white w-full rounded-t-3xl p-6 pt-2 shadow-2xl left-0 right-0`}
        style={{
          maxHeight: "70vh",
          overflowY: "auto",
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.15)"
        }}
      >
        <div className="space-y-4">
          {rideCreated && !confirmedRideData && (
            <div className="text-center space-y-3">
              <p className="text-base font-medium text-gray-700">Looking for nearby drivers...</p>
              <div className="h-1 w-12 rounded-full bg-blue-500 animate-pulse mx-auto"></div>
            </div>
          )}

          {/* Vehicle and Captain Info */}
          <div
            className={`flex ${
              confirmedRideData ? "justify-between items-start" : "justify-center"
            }`}
          >
            <div>
              <img
                src={
                  selectedVehicle == "car"
                    ? "/car.png"
                    : `/${selectedVehicle}.webp`
                }
                className={`${confirmedRideData ? "h-20 w-20" : "h-16 w-16"} object-contain mix-blend-multiply`}
              />
            </div>

            {confirmedRideData?._id && (
              <div className="text-right space-y-1">
                <h2 className="text-base font-bold text-gray-900">
                  {confirmedRideData?.captain?.fullname?.firstname}{" "}
                  {confirmedRideData?.captain?.fullname?.lastname}
                </h2>
                <p className="text-lg font-bold text-gray-900">
                  {confirmedRideData?.captain?.vehicle?.number}
                </p>
                <p className="text-xs text-gray-600 capitalize">
                  {confirmedRideData?.captain?.vehicle?.color}{" "}
                  {confirmedRideData?.captain?.vehicle?.type}
                </p>
                {confirmedRideData?.etaToPickup && (
                  <p className="text-xs text-green-700 font-medium mt-1">
                    Driver arriving in{" "}
                    <span className="font-semibold">
                      {confirmedRideData.etaToPickup.etaMinutes} min
                    </span>{" "}
                    ({confirmedRideData.etaToPickup.distanceKm} km away)
                  </p>
                )}
                <div className="mt-2 inline-block bg-black text-white px-3 py-1 rounded-lg font-bold text-sm">
                  OTP: {confirmedRideData?.otp}
                </div>
              </div>
            )}
          </div>

          {confirmedRideData?._id && (
            <div className="flex gap-3">
              <Button
                title={"Message"}
                size="md"
                variant="secondary"
                fullWidth={true}
              />
              <button className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors shrink-0">
                <a href={"tel:" + confirmedRideData?.captain?.phone}>
                  <PhoneCall size={20} strokeWidth={2} className="text-gray-900" />
                </a>
              </button>
            </div>
          )}

          {/* Location and Fare Details */}
          <div className="space-y-3 border-t border-gray-200 pt-4">
            {/* Pickup Location */}
            <div className="flex items-start gap-4">
              <div className="shrink-0 mt-1">
                <MapPinMinus size={20} className="text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900">
                  {pickupLocation.split(", ")[0]}
                </h3>
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {pickupLocation.split(", ").slice(1).join(", ")}
                </p>
              </div>
            </div>

            {/* Destination Location */}
            <div className="flex items-start gap-4">
              <div className="shrink-0 mt-1">
                <MapPinPlus size={20} className="text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900">
                  {destinationLocation.split(", ")[0]}
                </h3>
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {destinationLocation.split(", ").slice(1).join(", ")}
                </p>
              </div>
            </div>

            {/* Fare */}
            <div className="flex items-start gap-4 pt-2">
              <div className="shrink-0 mt-1">
                <CreditCard size={20} className="text-gray-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">
                  ₹{fare[selectedVehicle]}
                </h3>
                <p className="text-sm text-gray-600 mt-1">Cash payment</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-3">
            {/* Payment Button - Only show if ride is confirmed but not paid */}
            {confirmedRideData?._id && (
              <PaymentButton
                rideId={confirmedRideData._id}
                amount={fare[selectedVehicle]}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentFailure={handlePaymentFailure}
              />
            )}
          
            {/* Cancel Ride Button */}
            {(rideCreated || confirmedRideData) && (
              <Button
                title={"Cancel Ride"}
                size="md"
                variant="danger"
                fullWidth={true}
                loading={loading}
                fun={cancelRide}
              />
            )}
          
            {/* Confirm Ride Button */}
            {!rideCreated && !confirmedRideData && (
              <Button
                title={"Confirm Ride"}
                size="md"
                variant="primary"
                fullWidth={true}
                loading={loading}
                fun={createRide}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default RideDetails;
