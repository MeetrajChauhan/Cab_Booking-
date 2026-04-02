const express = require("express");
const { body } = require("express-validator");
const adminController = require("../controllers/admin.controller");
const { verifyAdminToken } = require("../middlewares/adminAuth.middleware");

const router = express.Router();

router.post(
  "/register",
  body("name").isLength({ min: 3 }).withMessage("Name must be at least 3 characters long"),
  body("email").isEmail().withMessage("Invalid email"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
  adminController.registerAdmin
);

router.post(
  "/login",
  body("email").isEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password is required"),
  adminController.loginAdmin
);

router.use(verifyAdminToken);

router.get("/dashboard-stats", adminController.getDashboardStats);
router.get("/users", adminController.getUsers);
router.delete("/users/:id", adminController.deleteUser);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.get("/captains", adminController.getCaptains);
router.delete("/captains/:id", adminController.deleteCaptain);
router.patch("/captains/:id/status", adminController.updateCaptainStatus);
router.get("/rides", adminController.getRides);
router.get("/rides/active", adminController.getActiveRides);
router.patch("/rides/:id/cancel", adminController.cancelRide);
router.get("/revenue", adminController.getRevenue);

module.exports = router;
