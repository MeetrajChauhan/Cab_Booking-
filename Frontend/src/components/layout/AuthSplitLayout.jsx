import { Link } from "react-router-dom";

function AuthSplitLayout({
  variant = "user",
  eyebrow,
  title,
  description,
  featureTitle,
  featureText,
  alternateLabel,
  alternateTo,
  alternateText,
  children,
}) {
  const accent =
    variant === "captain"
      ? "from-slate-900 via-slate-800 to-emerald-500"
      : "from-slate-200 via-white to-emerald-300";
  const textColor = variant === "captain" ? "text-white" : "text-slate-900";
  const muted = variant === "captain" ? "text-slate-300" : "text-slate-600";
  const panel =
    variant === "captain"
      ? "bg-slate-950/80 border-white/10 text-white"
      : "bg-white/85 border-white/80 text-slate-900";

  return (
    <div className={`min-h-dvh bg-gradient-to-br ${accent} p-4 sm:p-6`}>
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl shadow-slate-900/10 backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
        <div className={`hidden flex-col justify-between p-10 lg:flex ${textColor}`}>
          <div>
            <p className={`text-xs uppercase tracking-[0.45em] ${muted}`}>{eyebrow}</p>
            <h1 className="mt-5 max-w-lg text-5xl font-semibold leading-tight">
              {title}
            </h1>
            <p className={`mt-6 max-w-xl text-base leading-7 ${muted}`}>{description}</p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.75rem] border border-white/20 bg-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.3em]">Design System</p>
              <p className="mt-3 text-2xl font-semibold">{featureTitle}</p>
            </div>
            <div className={`rounded-[1.75rem] border border-white/15 p-5 text-sm leading-7 ${muted}`}>
              {featureText}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 sm:p-8">
          <div className={`w-full max-w-lg rounded-[2rem] border p-6 shadow-xl sm:p-8 ${panel}`}>
            {children}
            {alternateTo ? (
              <p className={`mt-6 text-center text-sm ${muted}`}>
                {alternateLabel}{" "}
                <Link to={alternateTo} className="font-semibold underline underline-offset-4">
                  {alternateText}
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthSplitLayout;
