const express = require("express");
const router = express.Router();
const captainController = require("../controllers/captain.controller");
const { body } = require("express-validator");
const { authCaptain } = require("../middlewares/auth.middleware");
const { getActiveConnectionsCount } = require("../socket");
const captainModel = require("../models/captain.model");

router.post("/register",
    body("email").isEmail().withMessage("Invalid Email"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
    body("phone").isLength({ min: 10, max: 10 }).withMessage("Phone Number should be of 10 characters only"),
    body("fullname.firstname").isLength({min:3}).withMessage("First name must be at least 3 characters long"),
    captainController.registerCaptain
);

router.post("/verify-email", captainController.verifyEmail);

router.post("/login", 
    body("email").isEmail().withMessage("Invalid Email"),
    captainController.loginCaptain
);

router.post("/update", 
    body("captainData.phone").isLength({ min: 10, max: 10 }).withMessage("Phone Number should be of 10 characters only"),
    body("captainData.fullname.firstname").isLength({min:2}).withMessage("First name must be at least 2 characters long"),
    authCaptain,
    captainController.updateCaptainProfile
);

router.get("/profile", authCaptain, captainController.captainProfile);

router.get("/logout", authCaptain, captainController.logoutCaptain);

router.post(
    "/reset-password",
    body("token").notEmpty().withMessage("Token is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
    captainController.resetPassword
);

/**
 * GET /captain/status
 * Debug endpoint to check socket connections and online captains
 * Useful for troubleshooting ride notification issues
 */
router.get("/status", async (req, res) => {
    try {
        // Get active socket connections count
        const connections = getActiveConnectionsCount();
        
        // Get online captains from database
        const onlineCaptains = await captainModel.find({
            isOnline: true,
            socketId: { $ne: null }
        }).select("fullname vehicle.type status isOnline socketId location lastSeen");
        
        // Get total captain count
        const totalCaptains = await captainModel.countDocuments();
        
        res.status(200).json({
            message: "Captain status retrieved",
            socketConnections: connections,
            database: {
                totalCaptains,
                onlineCaptains: onlineCaptains.length,
                captains: onlineCaptains.map(c => ({
                    name: `${c.fullname.firstname} ${c.fullname.lastname || ''}`,
                    vehicleType: c.vehicle?.type,
                    status: c.status,
                    isOnline: c.isOnline,
                    hasSocketId: !!c.socketId,
                    socketId: c.socketId?.substring(0, 8) + '...',
                    location: c.location?.coordinates,
                    lastSeen: c.lastSeen
                }))
            }
        });
    } catch (error) {
        console.error("Error fetching captain status:", error);
        res.status(500).json({ message: "Failed to get status", error: error.message });
    }
});

module.exports = router;
