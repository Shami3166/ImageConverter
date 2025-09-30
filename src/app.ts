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
  "http://localhost:5173",  // Vite default
  "http://localhost:3000",  // CRA default
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "https://convert-craft.vercel.app", // ✅ Your deployed frontend
  process.env.FRONTEND_URL, // For flexibility in env
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl, Postman, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`❌ Blocked by CORS: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true, // ✅ Allow cookies
}));

app.use(morgan("dev"));
app.use(cookieParser());

// ✅ Middleware for JSON & URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/convert", conversionRoutes);
app.use("/api/user", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api", converterRoutes);

app.get("/", (req, res) => {
  res.send({
    message: "✅ Image Converter API is running!",
    docs: "/api",
  });
});

// ✅ Error handler (should always be last)
app.use(errorHandler);

export default app;
