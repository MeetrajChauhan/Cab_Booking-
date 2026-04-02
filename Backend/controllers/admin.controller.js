const { validationResult } = require("express-validator");
const adminModel = require("../models/admin.model");
const userModel = require("../models/user.model");
const captainModel = require("../models/captain.model");
const rideModel = require("../models/ride.model");

const COMMISSION_RATE = Number(process.env.ADMIN_COMMISSION_RATE || 0.2);

function formatName(fullname = {}) {
  return [fullname.firstname, fullname.lastname].filter(Boolean).join(" ").trim();
}

function roundCurrency(value) {
  return Number((value || 0).toFixed(2));
}

function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getStartOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getRecentDateLabels(days) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - index - 1));
    return date;
  });
}

function getRecentMonthLabels(months) {
  return Array.from({ length: months }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() - (months - index - 1));
    return date;
  });
}

function mapRideForAdmin(ride) {
  return {
    id: ride._id,
    passenger: ride.user
      ? {
          id: ride.user._id,
          name: formatName(ride.user.fullname),
          email: ride.user.email,
          phone: ride.user.phone,
          status: ride.user.accountStatus || "active",
        }
      : null,
    captain: ride.captain
      ? {
          id: ride.captain._id,
          name: formatName(ride.captain.fullname),
          email: ride.captain.email,
          phone: ride.captain.phone,
          vehicle: ride.captain.vehicle?.type || null,
          status: ride.captain.accountStatus || "active",
        }
      : null,
    pickup: ride.pickup,
    drop: ride.destination,
    fare: ride.fare,
    vehicle: ride.vehicle,
    rideStatus: ride.status,
    paymentStatus: ride.payment?.status || "pending",
    createdAt: ride.createdAt,
    updatedAt: ride.updatedAt,
  };
}

function calculateRideCommission(ride) {
  return roundCurrency((ride.fare || 0) * COMMISSION_RATE);
}

async function getCompletedRides() {
  return rideModel
    .find({ status: "completed" })
    .select("fare status createdAt updatedAt")
    .lean();
}

async function buildRevenueSummary() {
  const completedRides = await getCompletedRides();
  const today = getStartOfToday();
  const month = getStartOfMonth();

  let totalRevenue = 0;
  let todayRevenue = 0;
  let monthlyRevenue = 0;

  const ridesPerDay = getRecentDateLabels(7).map((date) => ({
    key: date.toISOString().slice(0, 10),
    label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    count: 0,
  }));

  const revenuePerMonth = getRecentMonthLabels(6).map((date) => ({
    key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    label: date.toLocaleDateString("en-US", { month: "short" }),
    revenue: 0,
  }));

  completedRides.forEach((ride) => {
    const completedAt = ride.updatedAt || ride.createdAt;
    const commission = calculateRideCommission(ride);

    totalRevenue += commission;

    if (completedAt >= today) {
      todayRevenue += commission;
    }

    if (completedAt >= month) {
      monthlyRevenue += commission;
    }

    const dayKey = completedAt.toISOString().slice(0, 10);
    const dayBucket = ridesPerDay.find((entry) => entry.key === dayKey);
    if (dayBucket) {
      dayBucket.count += 1;
    }

    const monthKey = `${completedAt.getFullYear()}-${String(completedAt.getMonth() + 1).padStart(2, "0")}`;
    const monthIndex = revenuePerMonth.findIndex((entry) => entry.key === monthKey);

    if (monthIndex >= 0) {
      revenuePerMonth[monthIndex].revenue = roundCurrency(
        revenuePerMonth[monthIndex].revenue + commission
      );
    }
  });

  return {
    totalRevenue: roundCurrency(totalRevenue),
    todayRevenue: roundCurrency(todayRevenue),
    monthlyRevenue: roundCurrency(monthlyRevenue),
    totalRides: completedRides.length,
    ridesPerDay: ridesPerDay.map(({ key, ...entry }) => entry),
    revenuePerMonth: revenuePerMonth.map(({ key, ...entry }) => entry),
  };
}

module.exports.registerAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password } = req.body;
    const existingAdmin = await adminModel.findOne({ email });

    if (existingAdmin) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const admin = await adminModel.create({
      name,
      email,
      password: await adminModel.hashPassword(password),
    });

    const token = admin.generateAuthToken();

    return res.status(201).json({
      message: "Admin registered successfully",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register admin", error: error.message });
  }
};

module.exports.loginAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const admin = await adminModel.findOne({ email }).select("+password");

    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = admin.generateAuthToken();
    res.cookie("adminToken", token, { httpOnly: false });

    return res.status(200).json({
      message: "Admin logged in successfully",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login admin", error: error.message });
  }
};

module.exports.getDashboardStats = async (_req, res) => {
  try {
    const [totalUsers, totalCaptains, activeRides, completedRidesToday, revenueSummary] =
      await Promise.all([
        userModel.countDocuments(),
        captainModel.countDocuments(),
        rideModel.countDocuments({
          status: { $in: ["pending", "accepted", "ongoing"] },
        }),
        rideModel.countDocuments({
          status: "completed",
          updatedAt: { $gte: getStartOfToday() },
        }),
        buildRevenueSummary(),
      ]);

    return res.status(200).json({
      totalUsers,
      totalCaptains,
      activeRides,
      completedRidesToday,
      totalRevenue: revenueSummary.totalRevenue,
      ridesPerDay: revenueSummary.ridesPerDay,
      revenuePerMonth: revenueSummary.revenuePerMonth,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load dashboard stats", error: error.message });
  }
};

module.exports.getUsers = async (_req, res) => {
  try {
    const users = await userModel
      .find({})
      .select("fullname email phone rides accountStatus createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      users: users.map((user) => ({
        id: user._id,
        name: formatName(user.fullname),
        email: user.email,
        phone: user.phone || "N/A",
        totalRides: user.rides?.length || 0,
        accountStatus: user.accountStatus || "active",
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

module.exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await userModel.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};

module.exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Invalid user status" });
    }

    const user = await userModel.findByIdAndUpdate(
      req.params.id,
      { accountStatus: status },
      { new: true }
    ).select("fullname email phone rides accountStatus createdAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User status updated",
      user: {
        id: user._id,
        name: formatName(user.fullname),
        email: user.email,
        phone: user.phone || "N/A",
        totalRides: user.rides?.length || 0,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update user status", error: error.message });
  }
};

module.exports.getCaptains = async (_req, res) => {
  try {
    const captains = await captainModel
      .find({})
      .select("fullname email phone rides vehicle licenseNumber accountStatus createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      captains: captains.map((captain) => ({
        id: captain._id,
        name: formatName(captain.fullname),
        email: captain.email,
        phone: captain.phone || "N/A",
        vehicle: captain.vehicle
          ? `${captain.vehicle.color} ${captain.vehicle.type} (${captain.vehicle.number})`
          : "N/A",
        vehicleType: captain.vehicle?.type || "N/A",
        licenseNumber: captain.licenseNumber || "Pending",
        totalRides: captain.rides?.length || 0,
        driverStatus: captain.accountStatus || "active",
        createdAt: captain.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch captains", error: error.message });
  }
};

module.exports.deleteCaptain = async (req, res) => {
  try {
    const deletedCaptain = await captainModel.findByIdAndDelete(req.params.id);

    if (!deletedCaptain) {
      return res.status(404).json({ message: "Captain not found" });
    }

    return res.status(200).json({ message: "Captain removed successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove captain", error: error.message });
  }
};

module.exports.updateCaptainStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "suspended", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid captain status" });
    }

    const captain = await captainModel.findByIdAndUpdate(
      req.params.id,
      { accountStatus: status },
      { new: true }
    ).select("fullname email phone rides vehicle licenseNumber accountStatus createdAt");

    if (!captain) {
      return res.status(404).json({ message: "Captain not found" });
    }

    return res.status(200).json({
      message: "Captain status updated",
      captain: {
        id: captain._id,
        name: formatName(captain.fullname),
        email: captain.email,
        phone: captain.phone || "N/A",
        vehicle: captain.vehicle
          ? `${captain.vehicle.color} ${captain.vehicle.type} (${captain.vehicle.number})`
          : "N/A",
        vehicleType: captain.vehicle?.type || "N/A",
        licenseNumber: captain.licenseNumber || "Pending",
        totalRides: captain.rides?.length || 0,
        driverStatus: captain.accountStatus,
        createdAt: captain.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update captain status", error: error.message });
  }
};

module.exports.getRides = async (_req, res) => {
  try {
    const rides = await rideModel
      .find({})
      .populate("user", "fullname email phone accountStatus")
      .populate("captain", "fullname email phone vehicle accountStatus")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ rides: rides.map(mapRideForAdmin) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch rides", error: error.message });
  }
};

module.exports.getActiveRides = async (_req, res) => {
  try {
    const rides = await rideModel
      .find({ status: { $in: ["pending", "accepted", "ongoing"] } })
      .populate("user", "fullname email phone accountStatus")
      .populate("captain", "fullname email phone vehicle accountStatus")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ rides: rides.map(mapRideForAdmin) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch active rides", error: error.message });
  }
};

module.exports.cancelRide = async (req, res) => {
  try {
    const ride = await rideModel
      .findByIdAndUpdate(req.params.id, { status: "cancelled" }, { new: true })
      .populate("user", "fullname email phone accountStatus")
      .populate("captain", "fullname email phone vehicle accountStatus")
      .lean();

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    return res.status(200).json({
      message: "Ride cancelled successfully",
      ride: mapRideForAdmin(ride),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to cancel ride", error: error.message });
  }
};

module.exports.getRevenue = async (_req, res) => {
  try {
    const revenueSummary = await buildRevenueSummary();
    return res.status(200).json({
      totalRevenue: revenueSummary.totalRevenue,
      todayRevenue: revenueSummary.todayRevenue,
      monthlyRevenue: revenueSummary.monthlyRevenue,
      totalRides: revenueSummary.totalRides,
      commissionRate: COMMISSION_RATE,
      ridesPerDay: revenueSummary.ridesPerDay,
      revenuePerMonth: revenueSummary.revenuePerMonth,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch revenue stats", error: error.message });
  }
};
