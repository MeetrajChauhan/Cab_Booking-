import { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell";
import { adminDelete, adminGet, adminPatch, formatDate } from "./adminApi";

function statusClass(status) {
  return status === "suspended"
    ? "bg-rose-500/15 text-rose-200"
    : "bg-emerald-500/15 text-emerald-200";
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadUsers = () => {
    setLoading(true);
    adminGet("/users")
      .then((response) => {
        setUsers(response.data.users || []);
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || "Unable to load users");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateStatus = async (userId, status) => {
    setBusyId(userId);
    try {
      await adminPatch(`/users/${userId}/status`, { status });
      setUsers((current) =>
        current.map((user) =>
          user.id === userId ? { ...user, accountStatus: status } : user
        )
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update user");
    } finally {
      setBusyId("");
    }
  };

  const removeUser = async (userId) => {
    setBusyId(userId);
    try {
      await adminDelete(`/users/${userId}`);
      setUsers((current) => current.filter((user) => user.id !== userId));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete user");
    } finally {
      setBusyId("");
    }
  };

  return (
    <AdminShell
      title="User Management"
      subtitle="Review rider accounts, inspect activity volume, and suspend or remove problematic accounts."
    >
      {error ? (
        <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-5 py-4 text-sm text-slate-300">
          Total riders: {users.length}
        </div>
        {loading ? (
          <div className="px-5 py-8 text-sm text-slate-300">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/50 text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Rides</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Joined</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-white/5">
                    <td className="px-5 py-4 font-medium text-white">{user.name}</td>
                    <td className="px-5 py-4">{user.email}</td>
                    <td className="px-5 py-4">{user.phone}</td>
                    <td className="px-5 py-4">{user.totalRides}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs ${statusClass(user.accountStatus)}`}>
                        {user.accountStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busyId === user.id}
                          onClick={() =>
                            updateStatus(
                              user.id,
                              user.accountStatus === "suspended" ? "active" : "suspended"
                            )
                          }
                          className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200 transition hover:bg-amber-400/20 disabled:opacity-50"
                        >
                          {user.accountStatus === "suspended" ? "Activate" : "Suspend"}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === user.id}
                          onClick={() => removeUser(user.id)}
                          className="rounded-xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          Delete
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

export default AdminUsers;
