export const layoutThemes = {
  user: {
    shell:
      "bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.22),_transparent_34%),linear-gradient(180deg,_#e2e8f0_0%,_#cbd5e1_100%)] text-slate-900",
    sidebar: "bg-white/70 border-white/70",
    topbar: "bg-white/70 border-white/70",
    surface: "bg-white/72 border-white/80 shadow-slate-900/8",
    secondarySurface: "bg-slate-900 text-white border-slate-900/80 shadow-slate-900/20",
    navActive: "bg-slate-900 text-white shadow-lg shadow-slate-900/15",
    navIdle: "text-slate-600 hover:bg-white/65 hover:text-slate-900",
    badge: "bg-emerald-500/12 text-emerald-700 border border-emerald-500/20",
    subtleBadge: "bg-slate-900/6 text-slate-600 border border-slate-900/8",
    accentButton: "bg-slate-900 text-white hover:bg-slate-800",
    mutedText: "text-slate-500",
    statAccent: "text-emerald-700",
  },
  captain: {
    shell:
      "bg-[radial-gradient(circle_at_top,_rgba(71,85,105,0.28),_transparent_34%),linear-gradient(180deg,_#cbd5e1_0%,_#94a3b8_100%)] text-slate-950",
    sidebar: "bg-slate-950/80 border-white/10 text-white",
    topbar: "bg-slate-950/75 border-white/10 text-white",
    surface: "bg-white/84 border-white/70 shadow-slate-900/12",
    secondarySurface: "bg-slate-900 text-white border-slate-900/80 shadow-slate-900/20",
    navActive: "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20",
    navIdle: "text-slate-300 hover:bg-white/8 hover:text-white",
    badge: "bg-emerald-500/12 text-emerald-100 border border-emerald-300/20",
    subtleBadge: "bg-white/8 text-slate-300 border border-white/10",
    accentButton: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
    mutedText: "text-slate-400",
    statAccent: "text-emerald-300",
  },
  admin: {
    shell:
      "bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.2),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-slate-100",
    sidebar: "bg-slate-950 border-white/10 text-white",
    topbar: "bg-slate-950/70 border-white/10 text-white",
    surface: "bg-white/5 border-white/10 shadow-black/20",
    secondarySurface: "bg-slate-900 text-white border-slate-900/80 shadow-black/20",
    navActive: "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20",
    navIdle: "text-slate-300 hover:bg-white/5 hover:text-white",
    badge: "bg-emerald-500/12 text-emerald-100 border border-emerald-300/20",
    subtleBadge: "bg-white/8 text-slate-300 border border-white/10",
    accentButton: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
    mutedText: "text-slate-400",
    statAccent: "text-emerald-300",
  },
};

export function getLayoutTheme(variant = "user") {
  return layoutThemes[variant] || layoutThemes.user;
}
