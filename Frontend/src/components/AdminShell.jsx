import AdminSidebar from "./AdminSidebar";

function AdminShell({ title, subtitle, actions, children }) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.2),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-slate-100">
      <div className="flex min-h-dvh">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div className="pl-12 lg:pl-0">
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">
                  Operations Console
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-white">{title}</h2>
                {subtitle ? (
                  <p className="mt-2 max-w-2xl text-sm text-slate-400">{subtitle}</p>
                ) : null}
              </div>
              {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminShell;
