import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes";
import conversionRoutes from "./routes/conversionRoutes";
import userRoutes from "./routes/userRoutes";

import { errorHandler } from "./middleware/errorHandler";
import contactRoutes from "./routes/contactRoutes";
import converterRoutes from "./routes/converterRoutes";


const app = express();

// ✅ FIXED: Dynamic CORS configuration
const allowedOrigins = [
  "http://localhost:5173", // Vite default
  "http://localhost:3000", // Create React App default
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL, // Your production URL
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // ✅ IMPORTANT: Allow cookies to be sent
}));

app.use(morgan("dev"));
app.use(cookieParser());

// ❌ REMOVED: Webhook route - No payments needed

// ✅ Normal middleware and routes after this
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/convert", conversionRoutes);
app.use("/api/user", userRoutes);
// ❌ REMOVED: paymentRoutes usage
app.use("/api/contact", contactRoutes);
app.use("/api", converterRoutes);

// ✅ Error handler
app.use(errorHandler);

export default app;