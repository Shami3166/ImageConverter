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

// ✅ IMPORTANT: Cookie parser should be FIRST middleware
app.use(cookieParser());

// ✅ FIXED: Simplified CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000", 
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "https://convert-craft.vercel.app",
  "https://imageconverter-acsq.onrender.com",
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      console.log('✅ Allowed CORS for:', origin);
      return callback(null, true); // ✅ TEMPORARY: Allow all origins for debugging
      // For production: return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // ✅ This is crucial for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie']
}));

app.use(morgan("dev"));

// ✅ Body parser middleware
app.use(express.json({ limit: '100mb' })); // ✅ Increase limit for large files
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/convert", conversionRoutes);
app.use("/api/user", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api", converterRoutes);

// ✅ Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    cookies: req.cookies // ✅ Debug cookies
  });
});

app.get("/", (req, res) => {
  res.send({
    message: "✅ Image Converter API is running!",
    docs: "/api",
  });
});

// ✅ Error handler (should always be last)
app.use(errorHandler);

export default app;