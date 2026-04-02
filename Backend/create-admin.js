require("dotenv").config();
const mongoose = require("mongoose");
const adminModel = require("./models/admin.model");
require("./config/db");

const DEFAULT_ADMIN = {
  name: "QuickRide Admin",
  email: "admin@gmail.com",
  password: "Admin@12345",
};

async function seedAdmin() {
  try {
    await mongoose.connection.asPromise();

    const existingAdmin = await adminModel.findOne({ email: DEFAULT_ADMIN.email });

    if (existingAdmin) {
      console.log("Admin already exists");
      console.log(`Email: ${DEFAULT_ADMIN.email}`);
      console.log(`Password: ${DEFAULT_ADMIN.password}`);
      return;
    }

    const hashedPassword = await adminModel.hashPassword(DEFAULT_ADMIN.password);

    await adminModel.create({
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      password: hashedPassword,
    });

    console.log("Admin seeded successfully");
    console.log(`Email: ${DEFAULT_ADMIN.email}`);
    console.log(`Password: ${DEFAULT_ADMIN.password}`);
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedAdmin();
