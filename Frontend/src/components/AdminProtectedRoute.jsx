import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import {
  clearAdminSession,
  getAdminHeaders,
  getAdminToken,
} from "../pages/admin/adminApi";

function AdminProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const token = getAdminToken();

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setIsLoading(false);
      return;
    }

    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/admin/dashboard-stats`, {
        headers: getAdminHeaders(),
      })
      .then(() => {
        if (isMounted) {
          setIsAuthorized(true);
        }
      })
      .catch(() => {
        clearAdminSession();
        if (isMounted) {
          setIsAuthorized(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm tracking-wide">
          Verifying admin access...
        </div>
      </div>
    );
  }

  if (!token || !isAuthorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminProtectedRoute;
