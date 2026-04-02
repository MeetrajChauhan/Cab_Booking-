import { useEffect, useState } from "react";
import {
  Activity,
  CarTaxiFront,
  IndianRupee,
  Users,
  UserSquare2,
} from "lucide-react";
import AdminShell from "../../components/AdminShell";
import { adminGet, formatCurrency } from "./adminApi";

const cardConfig = [
  { key: "totalUsers", label: "Total Users", icon: Users },
  { key: "totalCaptains", label: "Total Captains", icon: CarTaxiFront },
  { key: "activeRides", label: "Active Rides", icon: Activity },
  { key: "completedRidesToday", label: "Completed Today", icon: UserSquare2 },
  { key: "totalRevenue", label: "Platform Revenue", icon: IndianRupee, currency: true },
];

function MetricCard({ label, value, icon: Icon, currency = false }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-4 text-3xl font-semibold text-white">
            {currency ? formatCurrency(value) : value}
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function BarChart({ title, subtitle, data, dataKey, colorClass }) {
  const maxValue = Math.max(...data.map((entry) => entry[dataKey] || 0), 1);

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>

      <div className="flex h-72 items-end gap-3">
        {data.map((entry) => (
          <div key={entry.label} className="flex flex-1 flex-col items-center gap-3">
            <p className="text-xs text-slate-400">{entry[dataKey]}</p>
            <div className="flex h-52 w-full items-end rounded-2xl bg-slate-900/70 p-2">
              <div
                className={`w-full rounded-xl ${colorClass} transition-all duration-500`}
                style={{ height: `${Math.max((entry[dataKey] / maxValue) * 100, 8)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">{entry.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminGet("/dashboard-stats")
      .then((response) => {
        setStats(response.data);
      })
      .catch((requestError) => {
        setError(
          requestError.response?.data?.message || "Unable to load dashboard stats"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <AdminShell
      title="Platform Dashboard"
      subtitle="Centralized operations view for marketplace growth, ride activity, and revenue performance."
    >
      {loading ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
          Loading dashboard analytics...
        </div>
      ) : error ? (
        <div className="rounded-[1.75rem] border border-rose-400/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {cardConfig.map(({ key, label, icon, currency }) => (
              <MetricCard
                key={key}
                label={label}
                value={stats[key]}
                icon={icon}
                currency={currency}
              />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <BarChart
              title="Rides Per Day"
              subtitle="Completed rides over the last 7 days"
              data={stats.ridesPerDay || []}
              dataKey="count"
              colorClass="bg-gradient-to-t from-emerald-500 to-lime-300"
            />
            <BarChart
              title="Revenue Per Month"
              subtitle="Platform commission trend for the last 6 months"
              data={stats.revenuePerMonth || []}
              dataKey="revenue"
              colorClass="bg-gradient-to-t from-sky-500 to-cyan-300"
            />
          </div>
        </div>
      )}
    </AdminShell>
  );
}

export default AdminDashboard;
