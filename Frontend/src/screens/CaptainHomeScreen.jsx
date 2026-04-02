import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useCaptain } from "../contexts/CaptainContext";
import {
  CarFront,
  CircleDollarSign,
  LayoutDashboard,
  Phone,
  Route,
  User,
  UserRound,
} from "lucide-react";
import { SocketDataContext } from "../contexts/SocketContext";
import { NewRide, LeafletMap } from "../components";
import Console from "../utils/console";
import { useAlert } from "../hooks/useAlert";
import { Alert } from "../components";
import MainLayout from "../components/layout/MainLayout";
import DashboardCard from "../components/layout/DashboardCard";

const captainNavItems = [
  { to: "/captain/home", label: "Dashboard", icon: LayoutDashboard },
  { to: "/captain/home", label: "Available Rides", icon: CarFront },
  { to: "/captain/rides", label: "My Rides", icon: Route },
  { to: "/captain/home", label: "Earnings", icon: CircleDollarSign },
  { to: "/captain/edit-profile", label: "Profile", icon: UserRound },
];

const defaultRideData = {
  user: {
    fullname: {
      firstname: "No",
      lastname: "User",
    },
    _id: "",
    email: "example@gmail.com",
    rides: [],
  },
  pickup: "Place, City, State, Country",
  destination: "Place, City, State, Country",
  fare: 0,
  vehicle: "car",
  status: "pending",
  duration: 0,
  distance: 0,
  _id: "123456789012345678901234",
};

function CaptainHomeScreen() {
  const token = localStorage.getItem("token");

  const { captain } = useCaptain();
  const { socket } = useContext(SocketDataContext);
  const [loading, setLoading] = useState(false);
  const { alert, showAlert, hideAlert } = useAlert();

  const [riderLocation, setRiderLocation] = useState({
    ltd: null,
    lng: null,
  });
  
  // Map state - using latitude and longitude instead of URL
  const [mapLat, setMapLat] = useState(28.6139); // Default to Delhi
  const [mapLng, setMapLng] = useState(77.2090);
  
  const [earnings, setEarnings] = useState({
    total: 0,
    today: 0,
  });

  const [rides, setRides] = useState({
    accepted: 0,
    cancelled: 0,
    distanceTravelled: 0,
  });
  const [newRide, setNewRide] = useState(
    JSON.parse(localStorage.getItem("rideDetails")) || defaultRideData
  );

  const [otp, setOtp] = useState("");
  const [messages, setMessages] = useState(
    JSON.parse(localStorage.getItem("messages")) || []
  );
  const [error, setError] = useState("");

  // Panels
  const [showCaptainDetailsPanel, setShowCaptainDetailsPanel] = useState(true);
  const [showNewRidePanel, setShowNewRidePanel] = useState(
    JSON.parse(localStorage.getItem("showPanel")) || false
  );
  const [showBtn, setShowBtn] = useState(
    JSON.parse(localStorage.getItem("showBtn")) || "accept"
  );
  const [isRideMinimized, setIsRideMinimized] = useState(false);

  const acceptRide = async () => {
    try {
      if (newRide._id != "") {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/ride/confirm`,
          { rideId: newRide._id },
          {
            headers: {
              token: token,
            },
          }
        );
        setLoading(false);
        setShowBtn("otp");
        
        // Update map with pickup location coordinates
        if (riderLocation.ltd && riderLocation.lng) {
          setMapLat(riderLocation.ltd);
          setMapLng(riderLocation.lng);
        }
        
        Console.log(response);
      }
    } catch (error) {
      setLoading(false);
      showAlert('Some error occured', error.response.data.message, 'failure');
      Console.log(error.response);
      setTimeout(() => {
        clearRideData();
      }, 1000);
    }
  };

  const verifyOTP = async () => {
    try {
      if (newRide._id !== "" && otp.length == 6) {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/ride/start-ride?rideId=${newRide._id}&otp=${otp}`,
          {
            headers: {
              token: token,
            },
          }
        );
        
        // Update map to show destination location
        if (riderLocation.ltd && riderLocation.lng) {
          setMapLat(riderLocation.ltd);
          setMapLng(riderLocation.lng);
        }
        
        setShowBtn("end-ride");
        setLoading(false);
        Console.log(response);
      }
    } catch (err) {
      setLoading(false);
      setError("Invalid OTP");
      Console.log(err);
    }
  };

  const endRide = async () => {
    try {
      if (newRide._id != "") {
        setLoading(true);
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/ride/end-ride`,
          {
            rideId: newRide._id,
          },
          {
            headers: {
              token: token,
            },
          }
        );
        
        // Update map back to captain's current location
        if (riderLocation.ltd && riderLocation.lng) {
          setMapLat(riderLocation.ltd);
          setMapLng(riderLocation.lng);
        }
        
        setShowBtn("accept");
        setLoading(false);
        setShowCaptainDetailsPanel(true);
        setShowNewRidePanel(false);
        setNewRide(defaultRideData);
        localStorage.removeItem("rideDetails");
        localStorage.removeItem("showPanel");
      }
    } catch (err) {
      setLoading(false);
      Console.log(err);
    }
  };

  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setRiderLocation({
            ltd: lat,
            lng: lng,
          });

          setMapLat(lat);
          setMapLng(lng);
          
          socket.emit("update-location-captain", {
            userId: captain._id,
            location: {
              ltd: lat,
              lng: lng,
            },
          });
        },
        (error) => {
          console.error("Error fetching position:", error);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.error("User denied the request for Geolocation.");
              break;
            case error.POSITION_UNAVAILABLE:
              console.error("Location information is unavailable.");
              break;
            case error.TIMEOUT:
              console.error("The request to get user location timed out.");
              break;
            default:
              console.error("An unknown error occurred.");
          }
        }
      );
    }
  };

  const clearRideData = () => {
    setShowBtn("accept");
    setLoading(false);
    setShowCaptainDetailsPanel(true);
    setShowNewRidePanel(false);
    setIsRideMinimized(false);
    setNewRide(defaultRideData);
    localStorage.removeItem("rideDetails");
    localStorage.removeItem("showPanel");
  }

  // Track if component is mounted to prevent state updates after unmount
  const [isOnline, setIsOnline] = useState(false);

  /**
   * CRITICAL: Socket connection and event listeners
   * - Join as captain when component mounts
   * - Listen for new ride requests
   * - Listen for ride cancellations
   * - Properly cleanup listeners on unmount
   */
  useEffect(() => {
    if (!captain._id || !socket) return;

    // Join as captain - this sets us online in the backend
    console.log("[Captain] Joining socket as captain:", captain._id);
    socket.emit("join", {
      userId: captain._id,
      userType: "captain",
    });

    // Update location immediately and set up interval
    updateLocation();
    const locationInterval = setInterval(updateLocation, 15000); // Update every 15s

    // Handler for new ride requests
    const handleNewRide = (data) => {
      Console.log("New Ride available:", data);
      setShowBtn("accept");
      setNewRide(data);
      setShowNewRidePanel(true);
      setIsRideMinimized(false);
      setShowCaptainDetailsPanel(false);
      
      // Play notification sound (optional)
      try {
        const audio = new Audio("/notification.mp3");
        audio.play().catch(() => {}); // Silently fail if no audio
      } catch {
        // Audio not available
      }
    };

    // Handler for ride cancellation
    const handleRideCancelled = (data) => {
      Console.log("Ride cancelled:", data);
      updateLocation();
      clearRideData();
    };

    // Handler for status updates from server
    const handleStatusUpdate = (data) => {
      Console.log("Status update:", data);
      if (data.status === "online") {
        setIsOnline(true);
      }
    };

    // Handler for location confirmation
    const handleLocationUpdated = (data) => {
      Console.log("Location updated:", data);
    };

    // Register event listeners
    socket.on("new-ride", handleNewRide);
    socket.on("ride-cancelled", handleRideCancelled);
    socket.on("status-update", handleStatusUpdate);
    socket.on("location-updated", handleLocationUpdated);

    // CRITICAL: Cleanup on unmount
    return () => {
      console.log("[Captain] Cleaning up socket listeners");
      clearInterval(locationInterval);
      socket.off("new-ride", handleNewRide);
      socket.off("ride-cancelled", handleRideCancelled);
      socket.off("status-update", handleStatusUpdate);
      socket.off("location-updated", handleLocationUpdated);
    };
  }, [captain._id, socket]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    socket.emit("join-room", newRide._id);

    socket.on("receiveMessage", async (msg) => {
      // Console.log("Received message: ", msg);
      setMessages((prev) => [...prev, { msg, by: "other" }]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [newRide]);

  useEffect(() => {
    localStorage.setItem("rideDetails", JSON.stringify(newRide));
  }, [newRide]);

  useEffect(() => {
    localStorage.setItem("showPanel", JSON.stringify(showNewRidePanel));
    localStorage.setItem("showBtn", JSON.stringify(showBtn));
  }, [showNewRidePanel, showBtn]);

  const calculateEarnings = () => {
    let Totalearnings = 0;
    let Todaysearning = 0;

    let acceptedRides = 0;
    let cancelledRides = 0;

    let distanceTravelled = 0;

    const today = new Date();
    const todayWithoutTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    captain.rides.forEach((ride) => {
      if (ride.status === "completed") {
        acceptedRides++;
        distanceTravelled += ride.distance;
        // Use driverFare if available; fallback to fare
        const rideIncome = typeof ride.driverFare === "number" ? ride.driverFare : ride.fare;
        Totalearnings += rideIncome;
      }

      if (ride.status === "cancelled") cancelledRides++;
      const rideDate = new Date(ride.updatedAt);

      const rideDateWithoutTime = new Date(
        rideDate.getFullYear(),
        rideDate.getMonth(),
        rideDate.getDate()
      );

      if (
        rideDateWithoutTime.getTime() === todayWithoutTime.getTime() &&
        ride.status === "completed"
      ) {
        const rideIncome = typeof ride.driverFare === "number" ? ride.driverFare : ride.fare;
        Todaysearning += rideIncome;
      }
    });

    setEarnings({ total: Totalearnings, today: Todaysearning });
    setRides({
      accepted: acceptedRides,
      cancelled: cancelledRides,
      distanceTravelled: Math.round(distanceTravelled / 1000),
    });
  };

  useEffect(() => {
    calculateEarnings();
  }, [captain]);

  useEffect(() => {
    if (socket.id) Console.log("socket id:", socket.id);
  }, [socket.id]);

  return (
    <MainLayout
      variant="captain"
      navItems={captainNavItems}
      identity={{
        firstname: captain?.fullname?.firstname,
        lastname: captain?.fullname?.lastname,
        email: captain?.email,
      }}
      title="Captain Dashboard"
      subtitle="Manage your shift, review earnings, and stay ready for incoming ride requests from a unified operator layout."
      topMeta={[
        { label: "Vehicle", value: captain?.vehicle?.number || "Not set" },
        { label: "Status", value: isOnline ? "Online" : "Connecting" },
      ]}
    >
      <Alert
        heading={alert.heading}
        text={alert.text}
        isVisible={alert.isVisible}
        onClose={hideAlert}
        type={alert.type}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          variant="captain"
          label="Today's rides"
          value={captain?.rides?.filter((ride) => {
            const rideDate = new Date(ride.updatedAt);
            const now = new Date();
            return (
              ride.status === "completed" &&
              rideDate.getDate() === now.getDate() &&
              rideDate.getMonth() === now.getMonth() &&
              rideDate.getFullYear() === now.getFullYear()
            );
          }).length || 0}
          helper="Completed during this shift"
          icon={CarFront}
        />
        <DashboardCard
          variant="captain"
          label="Total rides completed"
          value={rides?.accepted}
          helper="All successful rides"
          icon={Route}
        />
        <DashboardCard
          variant="captain"
          label="Earnings today"
          value={`Rs. ${earnings.today}`}
          helper="Current day earnings"
          icon={CircleDollarSign}
        />
        <DashboardCard
          variant="captain"
          label="Current ride status"
          value={showNewRidePanel ? showBtn.replace("-", " ") : "waiting"}
          helper={isOnline ? "Listening for requests" : "Opening connection"}
          icon={LayoutDashboard}
          invert
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="rounded-[1.9rem] border border-white/15 bg-white/8 p-6 shadow-lg shadow-slate-900/20 backdrop-blur">
            {showCaptainDetailsPanel && (
              <div className="space-y-5">
                <div className="booking-panel-header">
                  <h1 className="booking-panel-title text-white">Dashboard</h1>
                  <p className="booking-panel-subtitle text-slate-300">
                    {captain?.fullname?.firstname
                      ? `Welcome, ${captain.fullname.firstname}`
                      : "Stay online to receive rides"}
                  </p>
                </div>

                <div className="flex justify-between items-center rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
                  <div className="flex items-center gap-3">
                    <div className="select-none rounded-2xl w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                      <span className="text-lg font-bold text-slate-950">
                        {captain?.fullname?.firstname?.[0]}
                        {captain?.fullname?.lastname?.[0]}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">
                        {captain?.fullname?.firstname} {captain?.fullname?.lastname}
                      </h2>
                      <p className="text-xs flex items-center gap-1 text-slate-400">
                        <Phone size={12} />
                        {captain?.phone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Today</p>
                    <h3 className="font-bold text-xl text-emerald-300">Rs. {earnings.today}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/55 p-4 text-white">
                    <span className="text-2xl font-bold">{rides?.accepted}</span>
                    <p className="mt-1 text-xs text-slate-400">Rides completed</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/55 p-4 text-white">
                    <span className="text-2xl font-bold">{rides?.distanceTravelled}</span>
                    <p className="mt-1 text-xs text-slate-400">Km travelled</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/55 p-4 text-white">
                    <span className="text-2xl font-bold">{rides?.cancelled}</span>
                    <p className="mt-1 text-xs text-slate-400">Cancelled rides</p>
                  </div>
                </div>

                <div className="flex justify-between items-center rounded-[1.5rem] border border-white/10 bg-white/90 p-4 text-slate-900">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">
                      {captain?.vehicle?.number}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      {captain?.vehicle?.color} | <User size={12} strokeWidth={2.5} />{" "}
                      {captain?.vehicle?.capacity} seats
                    </p>
                  </div>
                  <img
                    className="h-16 scale-x-[-1] object-contain"
                    src={
                      captain?.vehicle?.type == "car"
                        ? "/car.png"
                        : `/${captain?.vehicle?.type}.webp`
                    }
                    alt="Your vehicle"
                  />
                </div>

                <div
                  className={`flex items-center justify-center gap-2 rounded-[1.4rem] border px-4 py-3 ${
                    isOnline
                      ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                      : "border-amber-300/25 bg-amber-400/10 text-amber-100"
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full animate-pulse ${
                      isOnline ? "bg-emerald-400" : "bg-amber-300"
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {isOnline ? "Online - Waiting for ride requests" : "Connecting..."}
                  </span>
                </div>
              </div>
            )}

            {showNewRidePanel && (
              <NewRide
                rideData={newRide}
                otp={otp}
                setOtp={setOtp}
                showBtn={showBtn}
                showPanel={!isRideMinimized}
                setShowPanel={setShowNewRidePanel}
                showPreviousPanel={setShowCaptainDetailsPanel}
                loading={loading}
                acceptRide={acceptRide}
                verifyOTP={verifyOTP}
                endRide={endRide}
                error={error}
                inlineMode={true}
                onBack={() => setIsRideMinimized(true)}
              />
            )}
          </section>

          <section className="rounded-[1.9rem] border border-white/15 bg-white/8 p-6 shadow-lg shadow-slate-900/20 backdrop-blur text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Shift Summary</p>
            <h3 className="mt-2 text-2xl font-semibold">Current performance</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total earnings</p>
                <p className="mt-3 text-2xl font-semibold text-emerald-300">Rs. {earnings.total}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current ride</p>
                <p className="mt-3 text-2xl font-semibold">
                  {showNewRidePanel ? newRide.status : "Waiting"}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-[1.9rem] border border-white/15 bg-white/8 p-4 shadow-lg shadow-slate-900/20 backdrop-blur">
            <div className="mb-4 flex items-center justify-between px-2 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Operations Map</p>
                <h3 className="mt-2 text-2xl font-semibold">Live route awareness</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium text-slate-300">
                {showNewRidePanel ? "Ride live" : "Awaiting request"}
              </span>
            </div>

            <div className="relative h-[520px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-200">
              <LeafletMap latitude={mapLat} longitude={mapLng} zoom={13} />

              {showNewRidePanel && isRideMinimized && (
                <button
                  type="button"
                  className="floating-ride-badge"
                  onClick={() => setIsRideMinimized(false)}
                >
                  <span className="floating-ride-badge-dot" />
                  <span className="floating-ride-badge-text">Ride</span>
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}

export default CaptainHomeScreen;
