import {
  CreditCard,
  MapPinMinus,
  MapPinPlus,
  PhoneCall,
  SendHorizontal,
  ChevronLeft,
} from "lucide-react";
import Button from "./Button";

function NewRide({
  rideData,
  otp,
  setOtp,
  showBtn,
  showPanel,
  setShowPanel,
  showPreviousPanel,
  loading,
  acceptRide,
  endRide,
  verifyOTP,
  error,
  inlineMode = false,
  onBack,
}) {
  const ignoreRide = () => {
    setShowPanel(false);
    showPreviousPanel(true);
  };

  // Amount captain will actually earn (after admin commission)
  const driverFare = rideData?.driverFare ?? rideData?.fare ?? 0;

  // Shared content for both modes
  const RideContent = () => (
    <>
      {/* User Info and Fare */}
      <div className="flex justify-between items-center pb-4">
        <div className="flex items-center gap-3">
          <div className="select-none rounded-full w-12 h-12 bg-green-500 flex items-center justify-center">
            <span className="text-lg font-semibold text-white">
              {rideData?.user?.fullname?.firstname?.[0]}
              {rideData?.user?.fullname?.lastname?.[0]}
            </span>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {rideData?.user?.fullname?.firstname}{" "}
              {rideData?.user?.fullname?.lastname}
            </h2>
            <p className="text-xs text-gray-500">
              {rideData?.user?.phone || rideData?.user?.email}
            </p>
          </div>
        </div>
        <div className="text-right">
          <h3 className="font-bold text-xl text-gray-900">₹{driverFare}</h3>
          <p className="text-xs text-gray-500">
            {(Number(rideData?.distance?.toFixed(2)) / 1000)?.toFixed(1)} Km
          </p>
        </div>
      </div>

      {/* Message and Call */}
      {showBtn !== "accept" && (
        <div className="flex gap-2 mb-4">
          <Button
            type={"link"}
            path={`/captain/chat/${rideData?._id}`}
            title={"Send a message..."}
            icon={<SendHorizontal strokeWidth={1.5} size={18} />}
            classes={"bg-zinc-100 font-medium text-sm text-zinc-950"}
          />
          <div className="flex items-center justify-center w-14 rounded-lg bg-zinc-100">
            <a href={"tel:" + rideData?.user?.phone}>
              <PhoneCall size={18} strokeWidth={2} color="black" />
            </a>
          </div>
        </div>
      )}

      {/* Location Details */}
      <div className="space-y-3 border-t border-gray-200 pt-4">
        <div className="flex items-start gap-3">
          <MapPinMinus size={20} className="text-gray-600 mt-1" />
          <div>
            <h3 className="font-bold text-gray-900">
              {rideData?.pickup?.split(", ")[0]}
            </h3>
            <p className="text-sm text-gray-600">
              {rideData?.pickup?.split(", ").slice(1).join(", ")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPinPlus size={20} className="text-gray-600 mt-1" />
          <div>
            <h3 className="font-bold text-gray-900">
              {rideData?.destination?.split(", ")[0]}
            </h3>
            <p className="text-sm text-gray-600">
              {rideData?.destination?.split(", ").slice(1).join(", ")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-2">
          <CreditCard size={20} className="text-gray-600 mt-1" />
          <div>
            <h3 className="font-bold text-gray-900">₹{driverFare}</h3>
            <p className="text-sm text-gray-600">Your earning (after commission)</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 space-y-3">
        {showBtn === "accept" ? (
          <div className="flex gap-3">
            <Button
              title={"Ignore"}
              loading={loading}
              fun={ignoreRide}
              classes={"bg-white text-zinc-900 border-2 border-black"}
            />
            <Button title={"Accept"} fun={acceptRide} loading={loading} />
          </div>
        ) : showBtn === "otp" ? (
          <>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              autoFocus
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(digits);
              }}
              placeholder="Enter 6-digit OTP"
              className="w-full bg-gray-100 px-4 py-3 rounded-xl outline-none text-sm border-2 border-transparent focus:border-black transition-colors"
              aria-label="OTP input"
            />
            {error && (
              <p className="text-red-500 text-xs text-center">{error}</p>
            )}
            <Button title={"Verify OTP"} loading={loading} fun={verifyOTP} />
          </>
        ) : (
          <Button
            title={"End Ride"}
            fun={endRide}
            loading={loading}
            classes={"bg-green-600"}
          />
        )}
      </div>
    </>
  );

  // Inline mode - renders directly in the left panel
  if (inlineMode && showPanel) {
    return (
      <div className="space-y-4">
        {/* Back button */}
        <button
          onClick={onBack || ignoreRide}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        <h2 className="text-xl font-bold text-gray-900">New Ride Request</h2>
        
        <RideContent />
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
          onClick={ignoreRide}
          aria-label="Close ride panel"
        />
      )}

      {/* New Ride Panel */}
      <div
        className={`${
          showPanel ? "bottom-0 z-10 pointer-events-auto" : "-bottom-full"
        } transition-all duration-500 absolute bg-white w-full rounded-t-3xl p-6 shadow-2xl left-0 right-0`}
        style={{
          maxHeight: "70vh",
          overflowY: "auto",
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.15)"
        }}
      >
        <RideContent />
      </div>
    </>
  );
}

export default NewRide;
