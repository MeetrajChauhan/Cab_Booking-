import { useMemo, useState } from "react";
import {
  Calendar,
  CarFront,
  ChevronUp,
  Clock,
  CreditCard,
  History,
  LayoutDashboard,
  Route,
  UserRound,
} from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import DashboardCard from "../components/layout/DashboardCard";

function RideHistory() {
  const userData = JSON.parse(localStorage.getItem("userData"));
  const [user] = useState(userData.data);
  const variant = userData.type === "captain" ? "captain" : "user";

  const navItems =
    variant === "captain"
      ? [
          { to: "/captain/home", label: "Dashboard", icon: LayoutDashboard },
          { to: "/captain/home", label: "Available Rides", icon: CarFront },
          { to: "/captain/rides", label: "My Rides", icon: History },
          { to: "/captain/home", label: "Earnings", icon: Route },
          { to: "/captain/edit-profile", label: "Profile", icon: UserRound },
        ]
      : [
          { to: "/home", label: "Home", icon: LayoutDashboard },
          { to: "/home", label: "Book Ride", icon: CarFront },
          { to: "/user/rides", label: "Ride History", icon: History },
          { to: "/user/edit-profile", label: "Profile", icon: UserRound },
        ];

  const ridesByDate = useMemo(() => classifyAndSortRides(user.rides || []), [user.rides]);
  const totalSpend = (user.rides || []).reduce((sum, ride) => {
    const rideValue =
      variant === "captain"
        ? ride.driverFare ?? ride.fare ?? 0
        : ride.fare ?? 0;

    return sum + rideValue;
  }, 0);

  return (
    <MainLayout
      variant={variant}
      navItems={navItems}
      identity={{
        firstname: user?.fullname?.firstname,
        lastname: user?.fullname?.lastname,
        email: user?.email,
      }}
      title={variant === "captain" ? "Captain Ride History" : "Ride History"}
      subtitle="Review recent trips in a grouped, card-based timeline aligned with the new workspace style."
      topMeta={[
        { label: "Total rides", value: user.rides?.length || 0 },
        { label: variant === "captain" ? "Total earnings" : "Total spend", value: `Rs. ${totalSpend}` },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          variant={variant}
          label="Today"
          value={ridesByDate.today.length}
          helper="Trips created today"
          icon={Calendar}
        />
        <DashboardCard
          variant={variant}
          label="Yesterday"
          value={ridesByDate.yesterday.length}
          helper="Trips created yesterday"
          icon={Clock}
        />
        <DashboardCard
          variant={variant}
          label="Earlier"
          value={ridesByDate.earlier.length}
          helper="Older ride records"
          icon={History}
          invert={variant === "captain"}
        />
      </div>

      <div className="mt-6 space-y-5">
        <HistorySection title="Today" rides={ridesByDate.today} variant={variant} defaultOpen />
        <HistorySection title="Yesterday" rides={ridesByDate.yesterday} variant={variant} defaultOpen />
        <HistorySection title="Earlier" rides={ridesByDate.earlier} variant={variant} defaultOpen />
      </div>
    </MainLayout>
  );
}

function classifyAndSortRides(rides) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isToday = (date) =>
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const isYesterday = (date) =>
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  const sortByDate = (items) =>
    [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const todayRides = [];
  const yesterdayRides = [];
  const earlierRides = [];

  rides.forEach((ride) => {
    const createdDate = new Date(ride.createdAt);
    if (isToday(createdDate)) {
      todayRides.push(ride);
    } else if (isYesterday(createdDate)) {
      yesterdayRides.push(ride);
    } else {
      earlierRides.push(ride);
    }
  });

  return {
    today: sortByDate(todayRides),
    yesterday: sortByDate(yesterdayRides),
    earlier: sortByDate(earlierRides),
  };
}

function HistorySection({ title, rides, variant, defaultOpen = false }) {
  const panelClass =
    variant === "captain"
      ? "border-white/15 bg-white/8 text-white"
      : "border-white/80 bg-white/72 text-slate-900";

  return (
    <details open={defaultOpen} className={`group rounded-[1.8rem] border p-5 shadow-lg backdrop-blur ${panelClass}`}>
      <summary className="flex cursor-pointer items-center justify-between select-none font-semibold">
        <span>{title}</span>
        <ChevronUp className="h-5 w-5 transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="mt-5 space-y-3">
        {rides.length > 0 ? (
          rides.map((ride) => <Ride ride={ride} key={ride._id} variant={variant} />)
        ) : (
          <h1 className={`text-sm text-center ${variant === "captain" ? "text-slate-400" : "text-slate-500"}`}>
            No rides found
          </h1>
        )}
      </div>
    </details>
  );
}

export const Ride = ({ ride, variant = "user" }) => {
  function formatDate(inputDate) {
    const date = new Date(inputDate);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  }

  function formatTime(inputDate) {
    const date = new Date(inputDate);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${formattedMinutes} ${period}`;
  }

  const cardClass =
    variant === "captain"
      ? "border-white/10 bg-slate-950/45 text-white"
      : "border-slate-200 bg-white/85 text-slate-900";

  return (
    <div className={`w-full rounded-[1.4rem] border px-4 py-4 ${cardClass}`}>
      <div className="flex flex-wrap gap-3 justify-between">
        <h1 className="text-sm flex gap-1 items-center font-semibold">
          <Calendar size={13} /> {formatDate(ride.createdAt)}
        </h1>

        <h1 className="text-sm flex gap-1 items-center font-semibold">
          <Clock size={13} /> {formatTime(ride.createdAt)}
        </h1>

        <h1 className="text-sm flex gap-1 items-center font-semibold">
          <CreditCard size={13} /> Rs. {ride.fare}
        </h1>
      </div>

      <div className={`w-full h-px my-3 ${variant === "captain" ? "bg-white/10" : "bg-slate-200"}`} />

      <div className="w-full truncate">
        <div className="flex items-center relative w-full h-fit">
          <div className="h-4/5 w-[3px] flex flex-col items-center justify-between border-dashed border-2 border-current rounded-full absolute mx-2 opacity-60">
            <div className="w-3 h-3 rounded-full border-[3px] -mt-1 bg-green-500 border-current"></div>
            <div className="w-3 h-3 rounded-sm border-[3px] -mb-1 bg-rose-400 border-current"></div>
          </div>
          <div className="ml-7 truncate w-full">
            <h1 className={`text-xs truncate ${variant === "captain" ? "text-slate-300" : "text-slate-600"}`} title={ride.pickup}>
              {ride.pickup}
            </h1>
            <div className="flex items-center gap-2">
              <div className={`w-full h-[2px] ${variant === "captain" ? "bg-white/10" : "bg-slate-200"}`}></div>
              <h1 className={`text-xs ${variant === "captain" ? "text-slate-400" : "text-slate-500"}`}>TO</h1>
              <div className={`w-full h-[2px] ${variant === "captain" ? "bg-white/10" : "bg-slate-200"}`}></div>
            </div>
            <h1 className={`text-xs truncate ${variant === "captain" ? "text-slate-300" : "text-slate-600"}`} title={ride.destination}>
              {ride.destination}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideHistory;
