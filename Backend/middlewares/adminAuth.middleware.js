const jwt = require("jsonwebtoken");
const adminModel = require("../models/admin.model");

module.exports.verifyAdminToken = async (req, res, next) => {
  const token =
    req.cookies.adminToken ||
    req.headers.admintoken ||
    req.headers["admin-token"] ||
    req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Admin authorization required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const admin = await adminModel.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: "Invalid admin token" });
    }

    req.admin = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    next();
  } catch (error) {
    if (error.message === "jwt expired") {
      return res.status(401).json({ message: "Admin token expired" });
    }

    return res.status(401).json({ message: "Invalid admin token" });
  }
};
