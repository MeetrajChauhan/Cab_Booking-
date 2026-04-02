import { useState } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { getAdminToken } from "./adminApi";

function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = getAdminToken();

  if (token) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/admin/login`,
        formData
      );

      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("adminData", JSON.stringify(response.data.admin));
      navigate("/admin/dashboard");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to sign in as admin"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#111827_100%)] px-4 py-10 text-slate-100">
      <div className="mx-auto grid min-h-[90dvh] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 shadow-2xl shadow-emerald-900/20 backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden flex-col justify-between bg-[linear-gradient(160deg,_rgba(16,185,129,0.2),_rgba(15,23,42,0.1))] p-10 lg:flex">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-emerald-300">
              QuickRide Admin
            </p>
            <h1 className="mt-5 max-w-md text-5xl font-semibold leading-tight text-white">
              Operate the platform without touching rider or captain flows.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              Dedicated access for analytics, ride monitoring, account moderation,
              and revenue visibility.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-emerald-200">Live modules</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                Users, Captains, Rides, Revenue
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-300">
              Separate auth token, isolated routes, and no overlap with customer sessions.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-xl"
          >
            <div className="mb-8 flex items-center gap-4">
              <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
                <ShieldCheck size={28} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">
                  Secure Login
                </p>
                <h2 className="mt-1 text-3xl font-semibold text-white">Admin Access</h2>
              </div>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Email</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@quickride.com"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Password</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                  required
                />
              </label>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Login to Admin Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
