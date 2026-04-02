import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  GetStarted,
  UserLogin,
  CaptainLogin,
  UserHomeScreen,
  CaptainHomeScreen,
  UserProtectedWrapper,
  CaptainProtectedWrapper,
  UserSignup,
  CaptainSignup,
  RideHistory,
  UserEditProfile,
  CaptainEditProfile,
  Error,
  ChatScreen,
  VerifyEmail,
  ResetPassword,
  ForgotPassword,
} from "./screens/";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCaptains from "./pages/admin/AdminCaptains";
import AdminRides from "./pages/admin/AdminRides";
import AdminRevenue from "./pages/admin/AdminRevenue";
import { logger } from "./utils/logger";
import { SocketDataContext } from "./contexts/SocketContext";
import { useEffect, useContext } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";

function App() {
  return (
    <BrowserRouter>
      <LoggingWrapper />
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;

function AppRouter() {
  const location = useLocation();

  if (location.pathname.startsWith("/admin")) {
    return (
      <Routes>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminProtectedRoute>
              <AdminUsers />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/captains"
          element={
            <AdminProtectedRoute>
              <AdminCaptains />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/rides"
          element={
            <AdminProtectedRoute>
              <AdminRides />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/revenue"
          element={
            <AdminProtectedRoute>
              <AdminRevenue />
            </AdminProtectedRoute>
          }
        />
        <Route path="*" element={<Error />} />
      </Routes>
    );
  }

  return <ConsumerAppRouter />;
}

function ConsumerAppRouter() {
  const location = useLocation();
  const showResetButton =
    ![
      "/",
      "/login",
      "/signup",
      "/captain/login",
      "/captain/signup",
    ].includes(location.pathname) &&
    !location.pathname.includes("/forgot-password") &&
    !location.pathname.includes("/reset-password") &&
    !location.pathname.includes("/verify-email");

  return (
    <div className="min-h-dvh">
      {showResetButton ? (
        <div className="fixed right-4 top-24 z-50 flex items-center gap-2 rounded-2xl border border-slate-300/70 bg-white/80 px-3 py-2 text-slate-700 shadow-lg backdrop-blur">
          <ChevronLeft />
          <button
            className="flex justify-center items-center w-10 h-10 rounded-2xl border border-red-300 bg-red-100 text-red-500"
            onClick={() => {
              alert("This will clear all your data and log you out to fix the app in case it got corrupted. Please confirm to proceed.");
              const confirmation = confirm("Are you sure you want to reset the app?");

              if (confirmation === true) {
                localStorage.clear();
                window.location.reload();
              }
            }}
          >
            <Trash2 strokeWidth={1.8} width={18} />
          </button>
        </div>
      ) : null}

      <Routes>
        <Route path="/" element={<GetStarted />} />
        <Route
          path="/home"
          element={
            <UserProtectedWrapper>
              <UserHomeScreen />
            </UserProtectedWrapper>
          }
        />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/signup" element={<UserSignup />} />
        <Route
          path="/user/edit-profile"
          element={
            <UserProtectedWrapper>
              <UserEditProfile />
            </UserProtectedWrapper>
          }
        />
        <Route
          path="/user/rides"
          element={
            <UserProtectedWrapper>
              <RideHistory />
            </UserProtectedWrapper>
          }
        />

        <Route
          path="/captain/home"
          element={
            <CaptainProtectedWrapper>
              <CaptainHomeScreen />
            </CaptainProtectedWrapper>
          }
        />
        <Route path="/captain/login" element={<CaptainLogin />} />
        <Route path="/captain/signup" element={<CaptainSignup />} />
        <Route
          path="/captain/edit-profile"
          element={
            <CaptainProtectedWrapper>
              <CaptainEditProfile />
            </CaptainProtectedWrapper>
          }
        />
        <Route
          path="/captain/rides"
          element={
            <CaptainProtectedWrapper>
              <RideHistory />
            </CaptainProtectedWrapper>
          }
        />
        <Route path="/:userType/chat/:rideId" element={<ChatScreen />} />
        <Route path="/:userType/verify-email/" element={<VerifyEmail />} />
        <Route path="/:userType/forgot-password/" element={<ForgotPassword />} />
        <Route path="/:userType/reset-password/" element={<ResetPassword />} />

        <Route path="*" element={<Error />} />
      </Routes>
    </div>
  );
}

function LoggingWrapper() {
  const location = useLocation();
  const { socket } = useContext(SocketDataContext);

  useEffect(() => {
    if (socket) {
      logger(socket);
    }
  }, [location.pathname, location.search]);
  return null;
}
