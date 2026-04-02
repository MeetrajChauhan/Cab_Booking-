import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { getLayoutTheme } from "./theme";

function Sidebar({
  variant = "user",
  navItems = [],
  title,
  subtitle,
  identity,
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const theme = getLayoutTheme(variant);
  const initials = useMemo(() => {
    return `${identity?.firstname?.[0] || ""}${identity?.lastname?.[0] || ""}` || "QR";
  }, [identity]);

  const content = (
    <div className="flex h-full flex-col">
      <div className="border-b border-inherit px-5 py-5">
        <p className={`text-xs uppercase tracking-[0.35em] ${theme.mutedText}`}>
          QuickRide
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <p className={`mt-1 text-sm ${theme.mutedText}`}>{subtitle}</p>

        <div className={`mt-5 flex items-center gap-3 rounded-3xl px-4 py-3 ${theme.surface}`}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {[identity?.firstname, identity?.lastname].filter(Boolean).join(" ") || "QuickRide"}
            </p>
            <p className={`truncate text-xs ${theme.mutedText}`}>{identity?.email || "Workspace"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={`${to}-${label}`}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all",
                isActive ? theme.navActive : theme.navIdle,
              ].join(" ")
            }
          >
            {Icon ? <Icon size={18} /> : null}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-inherit p-3">
        <button
          type="button"
          onClick={onLogout}
          className={`w-full rounded-2xl px-4 py-3 text-sm font-medium transition ${theme.accentButton}`}
        >
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={`hidden w-72 shrink-0 border-r lg:block ${theme.sidebar}`}>
        {content}
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed left-4 top-4 z-40 rounded-2xl border px-3 py-3 shadow-lg backdrop-blur lg:hidden ${theme.topbar}`}
      >
        <Menu size={20} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm lg:hidden">
          <div className={`h-full w-72 border-r ${theme.sidebar}`}>
            <div className="flex justify-end p-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 p-2"
              >
                <X size={18} />
              </button>
            </div>
            {content}
          </div>
        </div>
      ) : null}
    </>
  );
}

export default Sidebar;
