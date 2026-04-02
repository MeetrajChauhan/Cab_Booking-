import { useEffect, useState } from "react";
import { CalendarRange, IndianRupee, ReceiptText, WalletCards } from "lucide-react";
import AdminShell from "../../components/AdminShell";
import { adminGet, formatCurrency } from "./adminApi";

function RevenueCard({ label, value, icon: Icon, currency = true }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-4 text-3xl font-semibold text-white">
            {currency ? formatCurrency(value) : value}
          </p>
        </div>
        <div className="rounded-2xl bg-sky-400/15 p-3 text-sky-200">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function RevenueBars({ data }) {
  const maxValue = Math.max(...data.map((entry) => entry.revenue || 0), 1);

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">Revenue by Month</h3>
      <p className="mt-1 text-sm text-slate-400">
        Commission-based revenue using the configured admin commission rate.
      </p>

      <div className="mt-8 flex h-80 items-end gap-3">
        {data.map((entry) => (
          <div key={entry.label} className="flex flex-1 flex-col items-center gap-3">
            <span className="text-xs text-slate-400">{formatCurrency(entry.revenue)}</span>
            <div className="flex h-56 w-full items-end rounded-2xl bg-slate-900/70 p-2">
              <div
                className="w-full rounded-xl bg-gradient-to-t from-cyan-500 to-sky-300"
                style={{ height: `${Math.max((entry.revenue / maxValue) * 100, 8)}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminRevenue() {
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminGet("/revenue")
      .then((response) => {
        setRevenue(response.data);
      })
      .catch((requestError) => {
        setError(
          requestError.response?.data?.message || "Unable to load revenue stats"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <AdminShell
      title="Revenue Intelligence"
      subtitle="Track commission-driven platform performance with daily and monthly visibility."
    >
      {loading ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
          Loading revenue metrics...
        </div>
      ) : error ? (
        <div className="rounded-[1.75rem] border border-rose-400/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <RevenueCard label="Total Revenue" value={revenue.totalRevenue} icon={WalletCards} />
            <RevenueCard label="Today's Revenue" value={revenue.todayRevenue} icon={IndianRupee} />
            <RevenueCard label="Monthly Revenue" value={revenue.monthlyRevenue} icon={CalendarRange} />
            <RevenueCard label="Completed Rides" value={revenue.totalRides} icon={ReceiptText} currency={false} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <RevenueBars data={revenue.revenuePerMonth || []} />
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold text-white">Revenue Model</h3>
              <div className="mt-6 space-y-4 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-slate-400">Commission rate</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {Math.round((revenue.commissionRate || 0) * 100)}%
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 leading-7 text-slate-400">
                  Platform revenue is derived from completed rides using the configured
                  admin commission rate. This view remains separate from rider and captain
                  booking flows.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

export default AdminRevenue;
