const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },
  },
  { timestamps: true }
);

adminSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 10);
};

adminSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

adminSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, userType: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

module.exports = mongoose.model("Admin", adminSchema);
