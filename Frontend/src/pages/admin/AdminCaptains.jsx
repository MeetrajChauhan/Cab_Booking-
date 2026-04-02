import { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell";
import { adminDelete, adminGet, adminPatch, formatDate } from "./adminApi";

function badgeClass(status) {
  if (status === "suspended") {
    return "bg-rose-500/15 text-rose-200";
  }

  if (status === "pending") {
    return "bg-amber-400/15 text-amber-100";
  }

  return "bg-emerald-500/15 text-emerald-200";
}

function AdminCaptains() {
  const [captains, setCaptains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadCaptains = () => {
    setLoading(true);
    adminGet("/captains")
      .then((response) => {
        setCaptains(response.data.captains || []);
      })
      .catch((requestError) => {
        setError(
          requestError.response?.data?.message || "Unable to load captains"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCaptains();
  }, []);

  const updateStatus = async (captainId, status) => {
    setBusyId(captainId);
    try {
      await adminPatch(`/captains/${captainId}/status`, { status });
      setCaptains((current) =>
        current.map((captain) =>
          captain.id === captainId ? { ...captain, driverStatus: status } : captain
        )
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to update captain status"
      );
    } finally {
      setBusyId("");
    }
  };

  const removeCaptain = async (captainId) => {
    setBusyId(captainId);
    try {
      await adminDelete(`/captains/${captainId}`);
      setCaptains((current) =>
        current.filter((captain) => captain.id !== captainId)
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to remove captain"
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <AdminShell
      title="Captain Management"
      subtitle="Approve, suspend, or remove drivers while keeping operating capacity visible."
    >
      {error ? (
        <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-5 py-4 text-sm text-slate-300">
          Total captains: {captains.length}
        </div>
        {loading ? (
          <div className="px-5 py-8 text-sm text-slate-300">Loading captains...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/50 text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Vehicle</th>
                  <th className="px-5 py-4">License</th>
                  <th className="px-5 py-4">Rides</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Joined</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {captains.map((captain) => (
                  <tr key={captain.id} className="border-t border-white/5">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{captain.name}</p>
                      <p className="text-xs text-slate-400">{captain.email}</p>
                    </td>
                    <td className="px-5 py-4">{captain.vehicle}</td>
                    <td className="px-5 py-4">{captain.licenseNumber}</td>
                    <td className="px-5 py-4">{captain.totalRides}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs ${badgeClass(captain.driverStatus)}`}>
                        {captain.driverStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{formatDate(captain.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busyId === captain.id}
                          onClick={() => updateStatus(captain.id, "active")}
                          className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200 transition hover:bg-emerald-400/20 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busyId === captain.id}
                          onClick={() => updateStatus(captain.id, "suspended")}
                          className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200 transition hover:bg-amber-400/20 disabled:opacity-50"
                        >
                          Suspend
                        </button>
                        <button
                          type="button"
                          disabled={busyId === captain.id}
                          onClick={() => removeCaptain(captain.id)}
                          className="rounded-xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
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

export default AdminCaptains;
