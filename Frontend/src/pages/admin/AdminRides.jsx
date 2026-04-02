import { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell";
import { adminGet, adminPatch, formatCurrency, formatDate } from "./adminApi";

function rideStatusClass(status) {
  const statusMap = {
    pending: "bg-amber-400/15 text-amber-100",
    accepted: "bg-sky-400/15 text-sky-100",
    ongoing: "bg-indigo-400/15 text-indigo-100",
    completed: "bg-emerald-500/15 text-emerald-200",
    cancelled: "bg-rose-500/15 text-rose-200",
  };

  return statusMap[status] || "bg-white/10 text-slate-200";
}

function AdminRides() {
  const [rides, setRides] = useState([]);
  const [activeRides, setActiveRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [busyId, setBusyId] = useState("");

  const loadRides = () => {
    setLoading(true);

    Promise.all([adminGet("/rides"), adminGet("/rides/active")])
      .then(([allResponse, activeResponse]) => {
        setRides(allResponse.data.rides || []);
        setActiveRides(activeResponse.data.rides || []);
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Unable to load rides");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadRides();
  }, []);

  const cancelRide = async (rideId) => {
    setBusyId(rideId);

    try {
      await adminPatch(`/rides/${rideId}/cancel`, {});
      setRides((current) =>
        current.map((ride) =>
          ride.id === rideId ? { ...ride, rideStatus: "cancelled" } : ride
        )
      );
      setActiveRides((current) => current.filter((ride) => ride.id !== rideId));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to cancel ride");
    } finally {
      setBusyId("");
    }
  };

  const data = activeTab === "active" ? activeRides : rides;

  return (
    <AdminShell
      title="Ride Monitoring"
      subtitle="Track live operations, inspect ride details, and intervene when a trip needs cancellation."
      actions={
        <div className="rounded-2xl border border-white/10 bg-white/5 p-1">
          {[
            { key: "all", label: "All rides" },
            { key: "active", label: "Active rides" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                "rounded-xl px-4 py-2 text-sm transition",
                activeTab === tab.key
                  ? "bg-emerald-400 text-slate-950"
                  : "text-slate-300 hover:text-white",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      }
    >
      {error ? (
        <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-5 py-4 text-sm text-slate-300">
          Showing {data.length} {activeTab === "active" ? "active" : "total"} rides
        </div>
        {loading ? (
          <div className="px-5 py-8 text-sm text-slate-300">Loading rides...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/50 text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">Ride</th>
                  <th className="px-5 py-4">Passenger</th>
                  <th className="px-5 py-4">Captain</th>
                  <th className="px-5 py-4">Pickup</th>
                  <th className="px-5 py-4">Drop</th>
                  <th className="px-5 py-4">Fare</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((ride) => (
                  <tr key={ride.id} className="border-t border-white/5 align-top">
                    <td className="px-5 py-4 text-xs text-slate-400">{ride.id}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{ride.passenger?.name || "Unassigned"}</p>
                      <p className="text-xs text-slate-400">{ride.passenger?.phone || "No phone"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{ride.captain?.name || "Unassigned"}</p>
                      <p className="text-xs text-slate-400">{ride.captain?.vehicle || "No vehicle"}</p>
                    </td>
                    <td className="px-5 py-4">{ride.pickup}</td>
                    <td className="px-5 py-4">{ride.drop}</td>
                    <td className="px-5 py-4">{formatCurrency(ride.fare)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs ${rideStatusClass(ride.rideStatus)}`}>
                        {ride.rideStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{formatDate(ride.createdAt)}</td>
                    <td className="px-5 py-4">
                      {["completed", "cancelled"].includes(ride.rideStatus) ? (
                        <span className="text-xs text-slate-500">No action</span>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === ride.id}
                          onClick={() => cancelRide(ride.id)}
                          className="rounded-xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          Cancel ride
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

export default AdminRides;
