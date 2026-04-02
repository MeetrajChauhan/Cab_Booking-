import { useEffect, useState } from "react";

import {
  ChevronRight,
  CircleUserRound,
  History,
  KeyRound,
  Menu,
  X,
} from "lucide-react";
import Button from "./Button";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Console from "../utils/console";

function Sidebar() {
  const token = localStorage.getItem("token");
  const [showSidebar, setShowSidebar] = useState(false);

  const [newUser, setNewUser] = useState({});

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    setNewUser(userData);
  }, []);

  const navigate = useNavigate();

  const logout = async () => {
    try {
      await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/${newUser.type}/logout`,
        {
          headers: {
            token: token,
          },
        }
      );

      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("messages");
      localStorage.removeItem("rideDetails");
      localStorage.removeItem("panelDetails");
      localStorage.removeItem("showPanel");
      localStorage.removeItem("showBtn");
      navigate("/");
    } catch (error) {
      Console.log("Error getting logged out", error);
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between select-none">
      <div className="space-y-6">
        {/* Profile header */}
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

        {/* User avatar and info */}
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
            <span className="text-3xl text-white font-semibold">
              {newUser?.data?.fullname?.firstname?.[0]}
              {newUser?.data?.fullname?.lastname?.[0]}
            </span>
          </div>
          <div className="text-center">
            <h2 className="font-bold text-xl text-gray-900">
              {newUser?.data?.fullname?.firstname}{" "}
              {newUser?.data?.fullname?.lastname}
            </h2>
            <p className="text-sm text-gray-500 break-all mt-1">
              {newUser?.data?.email}
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1 pt-2">
          <Link
            to={`/${newUser?.type}/edit-profile`}
            className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-gray-100 rounded-xl transition-colors group"
          >
            <div className="flex gap-3 items-center">
              <CircleUserRound size={20} className="text-gray-600 group-hover:text-gray-900" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Edit Profile</span>
            </div>
            <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600" />
          </Link>

          <Link
            to={`/${newUser?.type}/rides`}
            className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-gray-100 rounded-xl transition-colors group"
          >
            <div className="flex gap-3 items-center">
              <History size={20} className="text-gray-600 group-hover:text-gray-900" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Ride History</span>
            </div>
            <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600" />
          </Link>

          <Link
            to={`/${newUser?.type}/reset-password?token=${token}`}
            className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-gray-100 rounded-xl transition-colors group"
          >
            <div className="flex gap-3 items-center">
              <KeyRound size={20} className="text-gray-600 group-hover:text-gray-900" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Change Password</span>
            </div>
            <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600" />
          </Link>
        </nav>
      </div>

      {/* Logout Button - anchored to bottom */}
      <div className="pt-4 border-t border-gray-200">
        <Button
          title={"Logout"}
          variant="danger"
          size="md"
          fullWidth={true}
          fun={logout}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar - persistent column on larger screens */}
      <aside className="hidden lg:flex dashboard-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile menu button - top-right, above content */}
      <div
        className="sidebar-menu-button lg:hidden"
        onClick={() => {
          setShowSidebar(!showSidebar);
        }}
        title={showSidebar ? "Close menu" : "Open menu"}
      >
        {showSidebar ? <X size={24} /> : <Menu size={24} />}
      </div>

      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay lg:hidden ${
          showSidebar ? "" : "hidden"
        }`}
      >
        <SidebarContent />
      </div>
    </>
  );
}

export default Sidebar;
