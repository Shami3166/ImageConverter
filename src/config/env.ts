import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "defaultsecret",
  CLOUDINARY: {
    NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
    API_KEY: process.env.CLOUDINARY_API_KEY || "",
    API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  },
  ADMIN: {
    EMAIL: process.env.ADMIN_EMAIL || "admin@example.com",
    PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
  },
  NODE_ENV: process.env.NODE_ENV || "production",
  UPLOAD_LIMIT: process.env.UPLOAD_LIMIT || "10mb",

  // ✅ Stripe configs
 
};
