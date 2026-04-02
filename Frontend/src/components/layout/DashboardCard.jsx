import { getLayoutTheme } from "./theme";

function DashboardCard({
  variant = "user",
  label,
  value,
  helper,
  icon: Icon,
  invert = false,
}) {
  const theme = getLayoutTheme(variant);
  const surface = invert ? theme.secondarySurface : theme.surface;

  return (
    <div className={`rounded-[1.75rem] border p-5 shadow-lg ${surface}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-sm ${invert ? "text-slate-400" : theme.mutedText}`}>{label}</p>
          <p className="mt-4 text-3xl font-semibold">{value}</p>
          {helper ? (
            <p className={`mt-2 text-xs ${invert ? "text-slate-400" : theme.mutedText}`}>{helper}</p>
          ) : null}
        </div>
        {Icon ? (
          <div className={`rounded-2xl p-3 ${invert ? "bg-white/10" : "bg-slate-900/5"}`}>
            <Icon size={22} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default DashboardCard;
