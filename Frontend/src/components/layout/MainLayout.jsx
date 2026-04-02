import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import { getLayoutTheme } from "./theme";

function MainLayout({
  variant = "user",
  navItems = [],
  title,
  subtitle,
  identity,
  topMeta = [],
  topActions = null,
  children,
}) {
  const navigate = useNavigate();
  const theme = getLayoutTheme(variant);

  const logout = async () => {
    const token = localStorage.getItem("token");
    const userType = variant === "captain" ? "captain" : "user";

    try {
      await axios.get(`${import.meta.env.VITE_SERVER_URL}/${userType}/logout`, {
        headers: {
          token,
        },
      });
    } catch {
      // Keep local cleanup even if the logout request fails.
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("messages");
      localStorage.removeItem("rideDetails");
      localStorage.removeItem("panelDetails");
      localStorage.removeItem("showPanel");
      localStorage.removeItem("showBtn");
      navigate(variant === "captain" ? "/captain/login" : "/login");
    }
  };

  return (
    <div className={`min-h-dvh ${theme.shell}`}>
      <div className="flex min-h-dvh">
        <Sidebar
          variant={variant}
          navItems={navItems}
          title={variant === "captain" ? "Captain Hub" : "Rider Hub"}
          subtitle={variant === "captain" ? "Driver operations" : "Trip workspace"}
          identity={identity}
          onLogout={logout}
        />
        <div className="min-w-0 flex-1">
          <TopNavbar
            variant={variant}
            title={title}
            subtitle={subtitle}
            meta={topMeta}
            actions={topActions}
          />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default MainLayout;
