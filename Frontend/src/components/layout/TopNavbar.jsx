import { getLayoutTheme } from "./theme";

function TopNavbar({ variant = "user", title, subtitle, meta, actions }) {
  const theme = getLayoutTheme(variant);

  return (
    <header className={`sticky top-0 z-30 border-b backdrop-blur ${theme.topbar}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="pl-12 lg:pl-0">
          <p className={`text-xs uppercase tracking-[0.35em] ${theme.mutedText}`}>
            Workspace
          </p>
          <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
          {subtitle ? <p className={`mt-2 max-w-2xl text-sm ${theme.mutedText}`}>{subtitle}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {meta?.map((item) => (
            <div key={item.label} className={`rounded-2xl px-4 py-3 ${theme.surface}`}>
              <p className={`text-[11px] uppercase tracking-[0.2em] ${theme.mutedText}`}>
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold">{item.value}</p>
            </div>
          ))}
          {actions}
        </div>
      </div>
    </header>
  );
}

export default TopNavbar;
