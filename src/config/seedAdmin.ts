import { ENV } from "./env";
import User from "../models/User";
import bcrypt from "bcryptjs";

export const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(ENV.ADMIN.PASSWORD, 10);
      await User.create({
        name: "Super Admin",
        email: ENV.ADMIN.EMAIL,
        password: hashedPassword,
        role: "admin",
        // ✅ REMOVED: plan field
      });
      console.log("✅ Admin user created");
    } else {
      console.log("ℹ️ Admin already exists, skipping seed.");
    }
  } catch (err) {
    console.error("❌ Failed to seed admin:", err);
  }
};