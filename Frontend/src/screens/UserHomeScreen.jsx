import { useContext, useEffect, useRef, useState } from "react";
import { useUser } from "../contexts/UserContext";
import {
  SelectVehicle,
  RideDetails,
  LeafletMap,
} from "../components";
import axios from "axios";
import { SocketDataContext } from "../contexts/SocketContext";
import Console from "../utils/console";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CarFront,
  History,
  MapPinned,
  MessageSquareMore,
  UserRound,
} from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import DashboardCard from "../components/layout/DashboardCard";
import LocationAutocomplete from "../components/location/LocationAutocomplete";

const userNavItems = [
  { to: "/home", label: "Home", icon: BookOpen },
  { to: "/home", label: "Book Ride", icon: CarFront },
  { to: "/user/rides", label: "Ride History", icon: History },
  { to: "/user/edit-profile", label: "Profile", icon: UserRound },
];

function UserHomeScreen() {
  const token = localStorage.getItem("token"); // this token is in use
  const { socket } = useContext(SocketDataContext);
  const { user } = useUser();
  const [messages, setMessages] = useState(
    JSON.parse(localStorage.getItem("messages")) || []
  );
  const [loading, setLoading] = useState(false);
  
  // Map state - using latitude and longitude instead of URL
  const [mapLat, setMapLat] = useState(28.6139); // Default to Delhi
  const [mapLng, setMapLng] = useState(77.2090);
  
  // route coordinates and markers for map display
  const [routeCoords, setRouteCoords] = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);

  const [rideCreated, setRideCreated] = useState(false);

  // Ride details
  const [pickupLocation, setPickupLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [pickupSelection, setPickupSelection] = useState(null);
  const [destinationSelection, setDestinationSelection] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState("car");
  const [fare, setFare] = useState({
    auto: 0,
    car: 0,
    bike: 0,
  });
  const [confirmedRideData, setConfirmedRideData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const rideTimeout = useRef(null);

  // Panels
  const [showFindTripPanel, setShowFindTripPanel] = useState(true);
  const [showSelectVehiclePanel, setShowSelectVehiclePanel] = useState(false);
  const [showRideDetailsPanel, setShowRideDetailsPanel] = useState(false);
  const [isRideMinimized, setIsRideMinimized] = useState(false);

  const getDistanceAndFare = async (pickupLocation, destinationLocation) => {
  console.log("Pickup:", pickupLocation);
  console.log("Destination:", destinationLocation);

  if (!pickupLocation || !destinationLocation) {
    alert("Please enter both pickup and destination.");
    return;
  }

  try {
    // reset previous route/markers when initiating a new search
    setRouteCoords([]);
    setMapMarkers([]);
    setLoading(true);

    // 🔐 Get token safely
    const token = localStorage.getItem("token");

    if (!token) {
      alert("You are not authenticated. Please login again.");
      setLoading(false);
      return;
    }

    // 🌍 Map will show default location
    // setMapLocation is no longer needed - using leaflet map instead

    // 🚀 Make API request
    const response = await axios.get(
      `${import.meta.env.VITE_SERVER_URL}/ride/get-fare`,
      {
        params: {
          pickup: pickupLocation,
          destination: destinationLocation,
        },
        headers: {
          token: token, // must match backend (req.headers.token)
        },
      }
    );

    console.log("Fare Response:", response.data);

    if (response.data?.fare) {
      setFare(response.data.fare);

      // update map with route and markers
      const dt = response.data.distanceTime;
      if (dt && dt.routeCoords && dt.routeCoords.length) {
        setRouteCoords(dt.routeCoords);
        // set map center to midpoint of route (or start)
        const mid = dt.routeCoords[Math.floor(dt.routeCoords.length / 2)];
        setMapLat(mid[0]);
        setMapLng(mid[1]);

        // markers for pickup and destination
        const start = dt.routeCoords[0];
        const end = dt.routeCoords[dt.routeCoords.length - 1];
        setMapMarkers([
          { lat: start[0], lng: start[1], label: "Pickup" },
          { lat: end[0], lng: end[1], label: "Destination" },
        ]);
      }

      setShowFindTripPanel(false);
      setShowSelectVehiclePanel(true);
    } else {
      alert("Could not calculate fare.");
    }

    setLoading(false);
  } catch (error) {
    console.error("Error fetching fare:", error);

    if (error.response?.status === 401) {
      alert("Session expired. Please login again.");
      localStorage.removeItem("token");
    } else if (error.response?.data?.message) {
      alert(error.response.data.message);
    } else {
      alert("Something went wrong while fetching fare.");
    }

    setLoading(false);
  }
};


  const createRide = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/ride/create`,
        {
          pickup: pickupLocation,
          destination: destinationLocation,
          vehicleType: selectedVehicle,
        },
        {
          headers: {
            token: token,
          },
        }
      );
      Console.log(response);
      const rideData = {
        pickup: pickupLocation,
        destination: destinationLocation,
        pickupCoordinates: pickupSelection
          ? { lat: pickupSelection.lat, lon: pickupSelection.lon }
          : null,
        destinationCoordinates: destinationSelection
          ? { lat: destinationSelection.lat, lon: destinationSelection.lon }
          : null,
        vehicleType: selectedVehicle,
        fare: fare,
        confirmedRideData: confirmedRideData,
        _id: response.data._id,
      };
      localStorage.setItem("rideDetails", JSON.stringify(rideData));
      setLoading(false);
      setRideCreated(true);

      // Automatically cancel the ride after 1.5 minutes
      rideTimeout.current = setTimeout(() => {
        cancelRide();
      }, import.meta.env.VITE_RIDE_TIMEOUT);
      
    } catch (error) {
      Console.log(error);
      setLoading(false);
    }
  };

  const cancelRide = async () => {
    const rideDetails = JSON.parse(localStorage.getItem("rideDetails"));
    try {
      setLoading(true);
      await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/ride/cancel?rideId=${rideDetails._id || rideDetails.confirmedRideData._id
        }`,
        {
          pickup: pickupLocation,
          destination: destinationLocation,
          vehicleType: selectedVehicle,
        },
        {
          headers: {
            token: token,
          },
        }
      );
      setLoading(false);
      updateLocation();
      setShowRideDetailsPanel(false);
      setShowSelectVehiclePanel(false);
      setShowFindTripPanel(true);
      setDefaults();
      localStorage.removeItem("rideDetails");
      localStorage.removeItem("panelDetails");
      localStorage.removeItem("messages");
      localStorage.removeItem("showPanel");
      localStorage.removeItem("showBtn");
    } catch (error) {
      Console.log(error);
      setLoading(false);
    }
  };
  // Set ride details to default values
  const setDefaults = () => {
    setPickupLocation("");
    setDestinationLocation("");
    setPickupSelection(null);
    setDestinationSelection(null);
    setSelectedVehicle("car");
    setFare({
      auto: 0,
      car: 0,
      bike: 0,
    });
    setConfirmedRideData(null);
    setRideCreated(false);
  };

  // Update Location
  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapLat(position.coords.latitude);
          setMapLng(position.coords.longitude);
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

  // Update Location
  useEffect(() => {
    updateLocation();
  }, []);

  // Socket Events - with proper cleanup
  useEffect(() => {
    if (!user._id || !socket) return;

    // Join as user
    console.log("[User] Joining socket as user:", user._id);
    socket.emit("join", {
      userId: user._id,
      userType: "user",
    });

    // Handler for ride confirmed
    const handleRideConfirmed = (data) => {
      Console.log("Clearing Timeout", rideTimeout);
      clearTimeout(rideTimeout.current);
      Console.log("Cleared Timeout");
      Console.log("Ride Confirmed");
      Console.log(data.captain.location);
      
      // Update map with captain's location
      if (data.captain.location && data.captain.location.coordinates) {
        setMapLat(data.captain.location.coordinates[1]);
        setMapLng(data.captain.location.coordinates[0]);
      }
      
      setConfirmedRideData(data);
      setDriverLocation(null);
    };

    // Handler for ride started
    const handleRideStarted = (data) => {
      Console.log("Ride started", data);
    };

    // Handler for ride ended
    const handleRideEnded = () => {
      Console.log("Ride Ended");
      setShowRideDetailsPanel(false);
      setShowSelectVehiclePanel(false);
      setShowFindTripPanel(true);
      setDefaults();
      localStorage.removeItem("rideDetails");
      localStorage.removeItem("panelDetails");
      setDriverLocation(null);
      setIsRideMinimized(false);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setMapLat(position.coords.latitude);
            setMapLng(position.coords.longitude);
          },
          (error) => {
            console.error("Error fetching position:", error);
          }
        );
      }
    };

    // Register event listeners
    socket.on("ride-confirmed", handleRideConfirmed);
    socket.on("ride-started", handleRideStarted);
    socket.on("ride-ended", handleRideEnded);

    // CRITICAL: Cleanup on unmount
    return () => {
      console.log("[User] Cleaning up socket listeners");
      socket.off("ride-confirmed", handleRideConfirmed);
      socket.off("ride-started", handleRideStarted);
      socket.off("ride-ended", handleRideEnded);
    };
  }, [user._id, socket]);

  // Listen for live captain location updates for the current ride
  useEffect(() => {
    if (!socket) return;

    const handleCaptainLocation = (payload) => {
      if (!payload || !payload.location) return;

      // If we know the current ride, ignore updates for other rides
      if (confirmedRideData?._id && payload.rideId && payload.rideId !== confirmedRideData._id) {
        return;
      }

      const { ltd, lng } = payload.location;
      if (typeof ltd !== "number" || typeof lng !== "number") return;

      setDriverLocation({ lat: ltd, lng: lng });

      // Keep map centered around the driver while en route
      setMapLat(ltd);
      setMapLng(lng);
    };

    socket.on("captain-location", handleCaptainLocation);

    return () => {
      socket.off("captain-location", handleCaptainLocation);
    };
  }, [socket, confirmedRideData?._id]);

  // Get ride details
  useEffect(() => {
    const storedRideDetails = localStorage.getItem("rideDetails");
    const storedPanelDetails = localStorage.getItem("panelDetails");

      if (storedRideDetails) {
      const ride = JSON.parse(storedRideDetails);
      setPickupLocation(ride.pickup);
      setDestinationLocation(ride.destination);
      setPickupSelection(
        ride.pickupCoordinates
          ? {
              name: ride.pickup,
              display_name: ride.pickup,
              lat: ride.pickupCoordinates.lat,
              lon: ride.pickupCoordinates.lon,
            }
          : null
      );
      setDestinationSelection(
        ride.destinationCoordinates
          ? {
              name: ride.destination,
              display_name: ride.destination,
              lat: ride.destinationCoordinates.lat,
              lon: ride.destinationCoordinates.lon,
            }
          : null
      );
      setSelectedVehicle(ride.vehicleType);
      setFare(ride.fare);
      setConfirmedRideData(ride.confirmedRideData);
    }

    if (storedPanelDetails) {
      const panels = JSON.parse(storedPanelDetails);
      setShowFindTripPanel(panels.showFindTripPanel);
      setShowSelectVehiclePanel(panels.showSelectVehiclePanel);
      setShowRideDetailsPanel(panels.showRideDetailsPanel);
    }
  }, []);

  // Store Ride Details
  useEffect(() => {
    const rideData = {
      pickup: pickupLocation,
      destination: destinationLocation,
      pickupCoordinates: pickupSelection
        ? { lat: pickupSelection.lat, lon: pickupSelection.lon }
        : null,
      destinationCoordinates: destinationSelection
        ? { lat: destinationSelection.lat, lon: destinationSelection.lon }
        : null,
      vehicleType: selectedVehicle,
      fare: fare,
      confirmedRideData: confirmedRideData,
    };
    localStorage.setItem("rideDetails", JSON.stringify(rideData));
  }, [
    pickupLocation,
    destinationLocation,
    pickupSelection,
    destinationSelection,
    selectedVehicle,
    fare,
    confirmedRideData,
  ]);

  // Store panel information
  useEffect(() => {
    const panelDetails = {
      showFindTripPanel,
      showSelectVehiclePanel,
      showRideDetailsPanel,
    };
    localStorage.setItem("panelDetails", JSON.stringify(panelDetails));
  }, [showFindTripPanel, showSelectVehiclePanel, showRideDetailsPanel]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    socket.emit("join-room", confirmedRideData?._id);

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, { msg, by: "other" }]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [confirmedRideData]);

  const recentRides = [...(user?.rides || [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);
  const completedRides = (user?.rides || []).filter(
    (ride) => ride.status === "completed"
  ).length;
  const activeRideLabel = confirmedRideData?.status
    ? confirmedRideData.status
    : rideCreated
      ? "searching"
      : "idle";

  return (
    <MainLayout
      variant="user"
      navItems={userNavItems}
      identity={{
        firstname: user?.fullname?.firstname,
        lastname: user?.fullname?.lastname,
        email: user?.email,
      }}
      title="Rider Dashboard"
      subtitle="Book new trips, monitor live ride state, and keep your recent travel activity in one workspace."
      topMeta={[
        { label: "Current status", value: activeRideLabel },
        { label: "Preferred vehicle", value: selectedVehicle },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          variant="user"
          label="Total rides"
          value={user?.rides?.length || 0}
          helper="All trips on this account"
          icon={History}
        />
        <DashboardCard
          variant="user"
          label="Completed rides"
          value={completedRides}
          helper="Successful finished trips"
          icon={CarFront}
        />
        <DashboardCard
          variant="user"
          label="Live ride status"
          value={activeRideLabel}
          helper={rideCreated ? "Driver search in progress" : "No live trip right now"}
          icon={MapPinned}
        />
        <DashboardCard
          variant="user"
          label="Messages"
          value={messages.length}
          helper="Trip-related chat history"
          icon={MessageSquareMore}
          invert
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="relative rounded-[1.9rem] border border-white/80 bg-white/72 p-6 shadow-lg shadow-slate-900/10 backdrop-blur">
            <div className="booking-panel-header">
              <h1 className="booking-panel-title">
                {showFindTripPanel
                  ? "Get a ride"
                  : showSelectVehiclePanel
                    ? "Choose a ride"
                    : "Ride details"}
              </h1>
              <p className="booking-panel-subtitle">
                {user?.fullname?.firstname
                  ? `Welcome, ${user.fullname.firstname}`
                  : "Book your next trip"}
              </p>
            </div>

            {showFindTripPanel && (
              <div className="space-y-6">
                <div className="location-input-group">
                  <div className="location-line">
                    <div className="location-dot" />
                    <div className="location-line-bar" />
                    <div className="location-square" />
                  </div>
                  <div className="location-inputs">
                    <LocationAutocomplete
                      placeholder="Pickup location"
                      value={pickupLocation}
                      onChange={(nextValue) => {
                        setPickupLocation(nextValue);
                        if (pickupSelection?.display_name !== nextValue) {
                          setPickupSelection(null);
                        }
                      }}
                      onSelect={(location) => {
                        setPickupSelection(location);
                        setPickupLocation(location.display_name);
                        setMapLat(location.lat);
                        setMapLng(location.lon);
                        setMapMarkers((current) => {
                          const destinationMarker = current.find(
                            (marker) => marker.label === "Destination"
                          );

                          return [
                            {
                              lat: location.lat,
                              lng: location.lon,
                              label: "Pickup",
                            },
                            ...(destinationMarker ? [destinationMarker] : []),
                          ];
                        });
                      }}
                    />
                    <LocationAutocomplete
                      placeholder="Where to?"
                      value={destinationLocation}
                      onChange={(nextValue) => {
                        setDestinationLocation(nextValue);
                        if (destinationSelection?.display_name !== nextValue) {
                          setDestinationSelection(null);
                        }
                      }}
                      onSelect={(location) => {
                        setDestinationSelection(location);
                        setDestinationLocation(location.display_name);
                        setMapLat(location.lat);
                        setMapLng(location.lon);
                        setMapMarkers((current) => {
                          const pickupMarker = current.find(
                            (marker) => marker.label === "Pickup"
                          );

                          return [
                            ...(pickupMarker ? [pickupMarker] : []),
                            {
                              lat: location.lat,
                              lng: location.lon,
                              label: "Destination",
                            },
                          ];
                        });
                      }}
                    />
                  </div>
                </div>

                {pickupLocation.length > 2 && destinationLocation.length > 2 && (
                  <button
                    className="search-ride-btn"
                    onClick={() =>
                      getDistanceAndFare(pickupLocation, destinationLocation)
                    }
                    disabled={loading}
                  >
                    {loading ? "Searching..." : "Search"}
                  </button>
                )}
              </div>
            )}

            {showSelectVehiclePanel && (
              <SelectVehicle
                selectedVehicle={setSelectedVehicle}
                showPanel={true}
                setShowPanel={setShowSelectVehiclePanel}
                showPreviousPanel={setShowFindTripPanel}
                showNextPanel={setShowRideDetailsPanel}
                fare={fare}
                inlineMode={true}
              />
            )}

            {showRideDetailsPanel && (
              <RideDetails
                pickupLocation={pickupLocation}
                destinationLocation={destinationLocation}
                selectedVehicle={selectedVehicle}
                fare={fare}
                showPanel={!isRideMinimized}
                setShowPanel={setShowRideDetailsPanel}
                showPreviousPanel={setShowSelectVehiclePanel}
                createRide={createRide}
                cancelRide={cancelRide}
                loading={loading}
                rideCreated={rideCreated}
                confirmedRideData={confirmedRideData}
                inlineMode={true}
                onBack={() => setIsRideMinimized(true)}
              />
            )}
          </section>

          <section className="rounded-[1.9rem] border border-white/80 bg-white/72 p-6 shadow-lg shadow-slate-900/10 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Active Trip
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                  {rideCreated || confirmedRideData ? "Ride in progress" : "Ready to book"}
                </h3>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
                {activeRideLabel}
              </span>
            </div>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pickup</p>
                <p className="mt-1 font-medium text-slate-900">
                  {pickupLocation || "Choose your start point"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Destination</p>
                <p className="mt-1 font-medium text-slate-900">
                  {destinationLocation || "Choose your destination"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Driver</p>
                <p className="mt-1 font-medium text-slate-900">
                  {confirmedRideData?.captain
                    ? `${confirmedRideData.captain.fullname.firstname} ${confirmedRideData.captain.fullname.lastname || ""}`
                    : "Not assigned yet"}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-[1.9rem] border border-white/80 bg-white/72 p-4 shadow-lg shadow-slate-900/10 backdrop-blur">
            <div className="mb-4 flex items-center justify-between px-2">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Live Map
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                  Ride tracking
                </h3>
              </div>
              <span className="rounded-full border border-slate-900/10 bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-600">
                {driverLocation ? "Driver visible" : "Map ready"}
              </span>
            </div>

            <div className="relative h-[480px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-200">
              <LeafletMap
                latitude={mapLat}
                longitude={mapLng}
                zoom={13}
                markers={[
                  ...mapMarkers,
                  ...(driverLocation
                    ? [
                        {
                          lat: driverLocation.lat,
                          lng: driverLocation.lng,
                          label: "Driver",
                        },
                      ]
                    : []),
                ]}
                route={routeCoords}
              />

              {showRideDetailsPanel && isRideMinimized && (
                <button
                  type="button"
                  className="floating-ride-badge"
                  onClick={() => setIsRideMinimized(false)}
                >
                  <span className="floating-ride-badge-dot" />
                  <span className="floating-ride-badge-text">Trip</span>
                </button>
              )}
            </div>
          </section>

          <section className="rounded-[1.9rem] border border-white/80 bg-white/72 p-6 shadow-lg shadow-slate-900/10 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Recent History
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                  Latest rides
                </h3>
              </div>
              <Link
                to="/user/rides"
                className="text-sm font-medium text-slate-700 underline underline-offset-4"
              >
                View all
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {recentRides.length > 0 ? (
                recentRides.map((ride) => (
                  <div
                    key={ride._id}
                    className="rounded-[1.4rem] border border-slate-200 bg-white/80 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {ride.pickup}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          to {ride.destination}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-900/6 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                        {ride.status}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                      <span>{new Date(ride.createdAt).toLocaleDateString("en-IN")}</span>
                      <span className="font-semibold text-slate-900">Rs. {ride.fare}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                  No rides yet. Book your first trip from the panel.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}

export default UserHomeScreen;
