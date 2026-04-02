import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CarFront,
  DoorOpen,
  LayoutDashboard,
  Menu,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { clearAdminSession, getAdminIdentity } from "../pages/admin/adminApi";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/captains", label: "Captains", icon: CarFront },
  { to: "/admin/rides", label: "Rides", icon: BarChart3 },
  { to: "/admin/revenue", label: "Revenue", icon: Wallet },
];

function AdminSidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const admin = useMemo(() => getAdminIdentity(), []);

  const logout = () => {
    clearAdminSession();
    navigate("/admin/login");
  };

  const content = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">
          QuickRide
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Admin Hub</h1>
        <p className="mt-3 text-sm text-slate-400">
          {admin?.name || "Platform Admin"}
        </p>
        <p className="text-xs text-slate-500">{admin?.email || "No session data"}</p>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all",
                isActive
                  ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              ].join(" ")
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-rose-200 transition hover:bg-rose-500/10 hover:text-white"
        >
          <DoorOpen size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950 lg:block">
        {content}
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-2xl border border-white/10 bg-slate-950/90 p-3 text-white shadow-lg backdrop-blur lg:hidden"
      >
        <Menu size={20} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm lg:hidden">
          <div className="h-full w-72 border-r border-white/10 bg-slate-950">
            <div className="flex justify-end p-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 p-2 text-slate-300"
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

export default AdminSidebar;
