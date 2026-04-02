const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const captainSchema = new mongoose.Schema(
  {
    fullname: {
      firstname: {
        type: String,
        required: true,
        minlength: 3,
      },
      lastname: {
        type: String,
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    phone: {
      type: String,
      minlength: 10,
      maxlength: 10,
    },
    socketId: {
      type: String,
      default: null,
    },
    // Track if captain is currently connected via socket
    isOnline: {
      type: Boolean,
      default: false,
      index: true, // Index for fast online captain queries
    },
    // Track last activity time
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    rides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ride",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active",
    },
    licenseNumber: {
      type: String,
      trim: true,
      default: "",
    },
    vehicle: {
      color: {
        type: String,
        required: true,
        minlength: [3, "Color must be at least 3 characters long"],
      },
      number: {
        type: String,
        required: true,
        minlength: [3, "Plate must be at least 3 characters long"],
      },
      capacity: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        required: true,
        enum: ["car", "bike", "auto"],
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0], // Default coordinates [lng, lat]
      },
    },
    emailVerified: {
      type: Boolean,
      default: true, // just for now 
    },
  },
  { timestamps: true }
);

// CRITICAL: Add 2dsphere index for geospatial queries
// This index is REQUIRED for $geoWithin, $near, etc. to work
captainSchema.index({ location: "2dsphere" });

// Compound index for efficient captain search
captainSchema.index({ "vehicle.type": 1, isOnline: 1, status: 1 });

captainSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

captainSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, userType: "captain" },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    }
  );
};

captainSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Static method to set captain online
captainSchema.statics.setOnline = async function (captainId, socketId) {
  return this.findByIdAndUpdate(
    captainId,
    {
      socketId: socketId,
      isOnline: true,
      lastSeen: new Date(),
      status: "active",
    },
    { new: true }
  );
};

// Static method to set captain offline
captainSchema.statics.setOffline = async function (socketId) {
  return this.findOneAndUpdate(
    { socketId: socketId },
    {
      socketId: null,
      isOnline: false,
      lastSeen: new Date(),
    },
    { new: true }
  );
};

// Static method to update captain location
captainSchema.statics.updateLocation = async function (captainId, lng, lat) {
  return this.findByIdAndUpdate(
    captainId,
    {
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
      lastSeen: new Date(),
    },
    { new: true }
  );
};

module.exports = mongoose.model("Captain", captainSchema);
