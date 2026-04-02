import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, CircleUserRound, History, LogOut, KeyRound } from "lucide-react";
import axios from "axios";
import Console from "../utils/console";

/**
 * ProfileDropdown - Uber-style profile menu in top-right header
 * Contains avatar with dropdown for profile actions
 */
function ProfileDropdown() {
  const token = localStorage.getItem("token");
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState({});
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("userData"));
    if (storedUser) {
      setUserData(storedUser);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = async () => {
    try {
      await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/${userData.type}/logout`,
        {
          headers: { token: token },
        }
      );

      // Clear all local storage
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("messages");
      localStorage.removeItem("rideDetails");
      localStorage.removeItem("panelDetails");
      localStorage.removeItem("showPanel");
      localStorage.removeItem("showBtn");
      navigate("/");
    } catch (error) {
      Console.log("Error logging out", error);
    }
  };

  const initials = `${userData?.data?.fullname?.firstname?.[0] || ""}${userData?.data?.fullname?.lastname?.[0] || ""}`;
  const fullName = `${userData?.data?.fullname?.firstname || ""} ${userData?.data?.fullname?.lastname || ""}`.trim();

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="profile-dropdown-trigger"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="profile-avatar">
          <span className="profile-avatar-initials">{initials || "U"}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`profile-dropdown-chevron ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="profile-dropdown-menu">
          {/* User Info Header */}
          <div className="profile-dropdown-header">
            <div className="profile-avatar-lg">
              <span>{initials || "U"}</span>
            </div>
            <div className="profile-dropdown-info">
              <p className="profile-dropdown-name">{fullName || "User"}</p>
              <p className="profile-dropdown-email">{userData?.data?.email || ""}</p>
            </div>
          </div>

          <div className="profile-dropdown-divider" />

          {/* Menu Items */}
          <nav className="profile-dropdown-nav">
            <Link
              to={`/${userData?.type}/edit-profile`}
              className="profile-dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              <CircleUserRound size={18} />
              <span>Edit Profile</span>
            </Link>

            <Link
              to={`/${userData?.type}/rides`}
              className="profile-dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              <History size={18} />
              <span>Ride History</span>
            </Link>

            <Link
              to={`/${userData?.type}/reset-password?token=${token}`}
              className="profile-dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              <KeyRound size={18} />
              <span>Change Password</span>
            </Link>
          </nav>

          <div className="profile-dropdown-divider" />

          {/* Logout */}
          <button
            onClick={logout}
            className="profile-dropdown-item profile-dropdown-logout"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
