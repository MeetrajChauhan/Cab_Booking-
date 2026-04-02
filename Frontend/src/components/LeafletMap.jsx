import { useEffect, useState, useRef, useContext } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SocketDataContext } from "../contexts/SocketContext";
import { useUser } from "../contexts/UserContext";

// Fix Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/**
 * LeafletMap Component
 * Displays an interactive map with markers
 * 
 * @param {number} latitude - Map center latitude (default: 28.6139 - Delhi)
 * @param {number} longitude - Map center longitude (default: 77.2090 - Delhi)
 * @param {number} zoom - Map zoom level (default: 13)
 * @param {Array} markers - Array of marker objects: [{lat: number, lng: number, label: string}]
 */
function LeafletMap({ 
  latitude = 28.6139, 
  longitude = 77.2090, 
  zoom = 13,
  markers = [],
  route = []             // array of [lat, lng] pairs for polyline
}) {
  // Validate coordinates
  const validLat = latitude && !isNaN(latitude) && latitude >= -90 && latitude <= 90 ? latitude : 28.6139;
  const validLng = longitude && !isNaN(longitude) && longitude >= -180 && longitude <= 180 ? longitude : 77.2090;

  // Keep map centered in sync with props
  function MapCenterUpdater({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
      map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
  }

  useEffect(() => {
    // Force map to resize after component mount (fixes partial rendering)
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Live user location and nearby captains
  const { socket } = useContext(SocketDataContext);
  const { user } = useUser();
  const [userPos, setUserPos] = useState({ lat: validLat, lng: validLng });
  const [captains, setCaptains] = useState([]);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    // Watch user position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserPos({ lat, lng });

        // Emit to socket to request nearby captains
        try {
          if (socket && socket.connected) {
            socket.emit("update-location-user", {
              userId: user?._id,
              location: { ltd: lat, lng: lng },
              radius: 4,
            });
          }
        } catch (e) {
          // ignore
        }
      },
      (err) => {
        console.error("Geolocation watch error:", err.message);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [socket, user]);

  useEffect(() => {
    if (!socket) return;

    const handler = (payload) => {
      if (!payload || !payload.captains) return setCaptains([]);
      setCaptains(payload.captains || []);
    };

    socket.on("nearby-captains", handler);
    return () => socket.off("nearby-captains", handler);
  }, [socket]);

  return (
    <MapContainer
      center={[validLat, validLng]}
      zoom={zoom}
      className="w-full h-full"
      style={{ 
        width: "100%", 
        height: "100%",
        zIndex: 0
      }}
      attributionControl={true}
      zoomControl={true}
    >
      {/* Sync center with external state */}
      <MapCenterUpdater lat={validLat} lng={validLng} />
      {/* OpenStreetMap Tile Layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        minZoom={3}
      />

      {/* Main location marker */}
      <Marker position={[userPos.lat || validLat, userPos.lng || validLng]}>
        <Popup>
          <div className="text-sm font-semibold">Current Location</div>
          <div className="text-xs text-gray-600">
            {(userPos.lat || validLat).toFixed(4)}, {(userPos.lng || validLng).toFixed(4)}
          </div>
        </Popup>
      </Marker>

      {/* Captain markers (live) */}
      {captains && captains.length > 0 &&
        captains.map((cap) => (
          <CircleMarker
            key={cap._id}
            center={[cap.location.coordinates[1], cap.location.coordinates[0]]}
            radius={8}
            pathOptions={{ color: "#ff4d4f" }}
          >
            <Popup>
              <div className="text-sm font-semibold">{cap.fullname?.firstname} {cap.fullname?.lastname || ''}</div>
              <div className="text-xs text-gray-600">{cap.vehicle?.type || 'vehicle'}</div>
            </Popup>
          </CircleMarker>
        ))}

      {/* Route polyline */}
      {route && route.length > 0 && (
        <Polyline
          positions={route}
          pathOptions={{ color: "#007bff", weight: 4 }}
        />
      )}

      {/* Additional markers */}
      {markers &&
        markers.length > 0 &&
        markers.map((marker, index) => (
          <Marker key={index} position={[marker.lat, marker.lng]}>
            <Popup>
              <div className="text-sm font-semibold">{marker.label || `Location ${index + 1}`}</div>
              <div className="text-xs text-gray-600">
                {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}

export default LeafletMap;
