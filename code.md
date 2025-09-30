
/src/config/db.ts

import mongoose from "mongoose";
import { ENV } from "./env";

export const connectDB = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};



/src/config/env.ts

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
  NODE_ENV: process.env.NODE_ENV || "development",
  UPLOAD_LIMIT: process.env.UPLOAD_LIMIT || "10mb",

  // ✅ Stripe configs
  STRIPE: {
    SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
    PRICE_USER: process.env.STRIPE_PRICE_USER || "",
    PRICE_PAID: process.env.STRIPE_PRICE_PAID || "",
  },
};


/src/config/seedAdmin.ts

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
        plan: "unlimited",
      });
      console.log("✅ Admin user created");
    } else {
      console.log("ℹ️ Admin already exists, skipping seed.");
    }
  } catch (err) {
    console.error("❌ Failed to seed admin:", err);
  }
};


/src/controllers/authController.ts

import { Request, Response } from "express";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import User from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Generate JWT
const generateToken = (id: string) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });
};

// @desc Register user
// @route POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

return res.status(201).json({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role, // 👈 add this
  token: generateToken((user._id as Types.ObjectId).toString()),
});
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// @desc Login user
// @route POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

return res.status(201).json({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role, // 👈 add this
  token: generateToken((user._id as Types.ObjectId).toString()),
});
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};



/src/controllers/conversionController.ts

import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { IUser } from "../models/User";
import { convertImage } from "../services/imageService";
import { convertVideo } from "../services/videoService";
import { pdfToImages, imagesToPdf } from "../services/pdfService";
import Conversion from "../models/Conversion";

interface AuthRequest extends Request {
  user?: IUser;
  file?: Express.Multer.File;
}

export const convertFile = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const role = req.user?.role || "guest";
  const size = req.file.size;

  const limits: Record<string, number> = {
    guest: 12 * 1024 * 1024,
    user: 50 * 1024 * 1024,
    paid: 200 * 1024 * 1024,
    admin: Infinity,
  };

  if (size > limits[role]) {
    return res.status(400).json({
      message: `Upload failed: ${role} users can only upload up to ${
        limits[role] / (1024 * 1024)
      } MB.`,
    });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const baseName = path.basename(req.file.originalname, ext);
  const outputDir = "uploads";
  fs.mkdirSync(outputDir, { recursive: true });

  const targetFormat = (req.body.targetFormat || "").toLowerCase();
  let outputFile = "";
  
  // ✅ Determine quality based on user role
  const quality = role === "admin" || role === "paid" ? 90 : 60;

  try {
    // ✅ Images (PNG, JPG, JPEG, WEBP, HEIC, SVG)
    if ([".png", ".jpg", ".jpeg", ".webp", ".heic", ".svg"].includes(ext)) {
      const format =
        targetFormat && ["png", "jpg", "jpeg", "webp"].includes(targetFormat)
          ? (targetFormat as "png" | "jpg" | "jpeg" | "webp")
          : ext === ".heic"
          ? "jpg"
          : ext === ".svg"
          ? "png" // default SVG → PNG if no format given
          : (ext.replace(".", "") as "png" | "jpg" | "jpeg" | "webp");

      outputFile = path.join(outputDir, `${baseName}-converted.${format}`);
      await convertImage(req.file.path, outputFile, format, quality);
    }

    // ✅ Video / GIF
    else if ([".gif", ".mp4"].includes(ext)) {
      const format =
        targetFormat && ["gif", "mp4"].includes(targetFormat)
          ? (targetFormat as "gif" | "mp4")
          : (ext.replace(".", "") as "gif" | "mp4");

      outputFile = path.join(outputDir, `${baseName}-converted.${format}`);
      await convertVideo(req.file.path, outputFile, format, quality);
    }

    // ✅ PDF
    else if (ext === ".pdf") {
      const pdfOutputDir = path.join(outputDir, baseName);
      fs.mkdirSync(pdfOutputDir, { recursive: true });

      const images = await pdfToImages(req.file.path, pdfOutputDir);
      outputFile = path.join(outputDir, `${baseName}-converted.pdf`);
      await imagesToPdf(images, outputFile);
    }

    else {
      return res.status(400).json({ message: "Unsupported file type" });
    }

    // ✅ Save conversion history
    if (req.user) {
      await Conversion.create({
        userId: req.user._id,
        fileType: ext.replace(".", ""),
        size,
      });
    }

    // ✅ Send file to user then cleanup
    res.download(outputFile, (err) => {
      if (err) console.error("Download error:", err);
      fs.unlink(req.file!.path, () => {});
      if (outputFile) fs.unlink(outputFile, () => {});
    });
  } catch (err) {
    console.error("❌ Conversion error:", err);
    res.status(500).json({ message: "Server error during conversion" });

    // Cleanup on error
    fs.unlink(req.file!.path, () => {});
    if (outputFile) fs.unlink(outputFile, () => {});
  }
};





/src/controllers/webhookController.ts


import { Request, Response } from "express";
import Stripe from "stripe";
import User from "../models/User";
import { ENV } from "../config/env";

// ✅ Corrected: Using the same API version as your other files
const stripe = new Stripe(ENV.STRIPE.SECRET_KEY, {
  apiVersion: "2025-08-27.basil" as any, // "as any" to bypass TS strictness
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    // 1. Verify the event to ensure it came from Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 2. Handle the event based on its type
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("✅ Checkout session completed:", session.id);
      
      // Get the user's email from the session and find them in the database
      const userEmail = session.customer_details?.email;
      if (userEmail) {
        try {
          const user = await User.findOne({ email: userEmail });
          if (user && user.role !== "paid") {
            // 3. Update the user's role to 'paid'
            user.role = "paid";
            await user.save();
            console.log(`✅ User ${userEmail} upgraded to 'paid' role.`);
          }
        } catch (error) {
          console.error("❌ Failed to update user role:", error);
        }
      }
      break;

    case "invoice.paid":
      // This event fires for recurring subscription payments
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`✅ Invoice paid for customer: ${invoice.customer}`);
      // Your logic to handle a successful recurring payment
      break;

    case "customer.subscription.deleted":
      // This event fires when a user cancels their subscription
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`❌ Subscription deleted for customer: ${subscription.customer}`);
      // Your logic to update the user's role back to a free plan
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // 4. Send back a 200 to acknowledge the event
  res.json({ received: true });
};






src/controllers/contactController.ts  


import { Request, Response } from "express";
import Contact from "../models/Contact";
import { IUser } from "../models/User";

interface AuthRequest extends Request {
  user?: IUser;
}

// @desc Create contact message
// @route POST /api/contact
export const createMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const contact = await Contact.create({
      userId: req.user?._id,
      name,
      email,
      message,
    });

    res.status(201).json({
      success: true,
      message: "✅ Message sent successfully",
      data: contact,
    });
  } catch (err) {
    console.error("❌ Contact error:", err);
    res.status(500).json({ message: "Server error sending message" });
  }
};

// @desc Get all contact messages (Admin only)
// @route GET /api/contact
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Contact.find().populate("userId", "name email");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching messages" });
  }
};



/src/controllers/paymentController.ts

import { Request, Response } from "express";
import Stripe from "stripe";
import { IUser } from "../models/User";

// ✅ use env variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-08-27.basil", // keep it current and type-safe
});

interface AuthRequest extends Request {
  user?: IUser;
}

export const checkout = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || "guest";

    // 🚀 Admin bypass
    if (role === "admin") {
      return res.json({
        message: "Admins do not need to pay. Full access granted.",
      });
    }

    const { plan } = req.body; // "user" | "paid"

    // ✅ price mapping (example, replace with your Stripe price IDs)
    const prices: Record<string, string> = {
      user: process.env.STRIPE_PRICE_USER || "",
      paid: process.env.STRIPE_PRICE_PAID || "",
    };

    if (!plan || !prices[plan]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    // ✅ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: prices[plan],
          quantity: 1,
        },
      ],
      mode: "subscription", // or "payment" if one-time
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      customer_email: req.user?.email, // auto-fill if logged in
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Payment error:", err);
    res.status(500).json({ message: "Payment server error" });
  }
};

// ✅ (Optional) Admin view of all payments
export const adminPayments = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // fetch last 10 sessions for monitoring
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    });

    res.json(sessions);
  } catch (err) {
    console.error("❌ Admin payment fetch error:", err);
    res.status(500).json({ message: "Server error fetching payments" });
  }
};




/src/controllers/userController.ts




import { Request, Response } from "express";
import { IUser } from "../models/User";
import Conversion from "../models/Conversion";
import Plan from "../models/Plan";
import User from "../models/User";

interface AuthRequest extends Request {
 user?: IUser;
}

// 📌 Get conversion history
export const getHistory = async (req: AuthRequest, res: Response) => {
 try {
  if (!req.user) {
   return res.status(401).json({ message: "Not authorized" });
  }

  let history;

  if (req.user.role === "admin") {
   history = await Conversion.find()
    .populate("userId", "name email role")
    .sort({ date: -1 })
    .lean();
  } else {
   history = await Conversion.find({ userId: req.user._id })
    .sort({ date: -1 })
    .lean();
  }

  // Format the response to match frontend expectations
  const formattedHistory = history.map((conv: any) => ({
   id: conv._id?.toString(),
   fileName: conv.fileName,
   originalFormat: conv.originalFormat,
   convertedFormat: conv.convertedFormat,
   size: conv.size,
   date: conv.date || conv.createdAt
  }));

  res.json(formattedHistory);
 } catch (err) {
  console.error("❌ History fetch error:", err);
  res.status(500).json({ message: "Server error fetching history" });
 }
};

// 📌 Upgrade Plan
export const upgradePlan = async (req: AuthRequest, res: Response) => {
 try {
  if (!req.user) {
   return res.status(401).json({ message: "Not authorized" });
  }

  const { planName } = req.body;

  if (req.user.role === "admin") {
   return res
    .status(400)
    .json({ message: "Admins already have unlimited access" });
  }

  const plan = await Plan.findOne({ name: planName });
  if (!plan) {
   return res.status(404).json({ message: "Plan not found" });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
   return res.status(404).json({ message: "User not found" });
  }

  user.role = planName;
  await user.save();

  res.json({
   message: `✅ Upgraded to ${planName} plan`,
   plan: {
    name: plan.name,
    price: plan.price,
    limit: plan.limit,
   },
  });
 } catch (err) {
  console.error("❌ Upgrade plan error:", err);
  res.status(500).json({ message: "Server error during upgrade" });
 }
};

// 📌 Get user role and conversion count
export const getUserInfo = async (req: AuthRequest, res: Response) => {
 try {
  if (!req.user) {
   return res.status(401).json({ message: "Not authorized" });
  }

  const role = req.user.role;
  const conversionCount = await Conversion.countDocuments({ userId: req.user._id });

  res.json({
   role,
   conversionCount,
  });
 } catch (err) {
  console.error("❌ Get user info error:", err);
  res.status(500).json({ message: "Server error fetching user info" });
 }
};


/src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";


const JWT_SECRET = process.env.JWT_SECRET || "secret";

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");
      return next();
    } catch (err) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};


/src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from "express";

// Centralized error handler
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("❌ Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Server error";

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};


/src/middleware/rateLimiter.ts


import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/User";
import Usage from "../models/Usage";

interface AuthRequest extends Request {
  user?: IUser;
  file?: Express.Multer.File;
}

const limits: Record<string, number> = {
  guest: 50 * 1024 * 1024,   // 50 MB/day
  user: 200 * 1024 * 1024,   // 200 MB/day
  paid: 1024 * 1024 * 1024,  // 1 GB/day
  admin: Infinity,           // No limit
};

export async function rateLimiter(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?._id?.toString();
    const role = req.user?.role || "guest";
    const fileSize = req.file?.size || 0;

    // ✅ Track by userId (logged in) or IP (guest)
    const key = userId || req.ip;

    // 🔍 Find or create usage record
    let usage = await Usage.findOne({ key });
    if (!usage) {
      usage = new Usage({ key, role, used: 0 });
    }

    // 🚨 Check limit
    const limit = limits[role];
    if (usage.used + fileSize > limit) {
      return res.status(429).json({
        message: `Rate limit exceeded: ${role} users can only process up to ${limit / (1024 * 1024)} MB per day.`,
      });
    }

    // ✅ Update usage
    usage.used += fileSize;
    await usage.save();

    next();
  } catch (err) {
    console.error("RateLimiter error:", err);
    res.status(500).json({ message: "Server error in rate limiter" });
  }
}




/src/middleware/validateRequest.ts
import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/User";
import { allowedFormats } from "../validators/conversionValidator";

interface AuthRequest extends Request {
  user?: IUser;
  file?: Express.Multer.File;
}

export const validateRequest = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const role = req.user?.role || "guest";
    if (role === "admin") return next();

    const ext = req.file.originalname.split(".").pop()?.toLowerCase();
    const mime = req.file.mimetype.toLowerCase();

    // ✅ Check extension & MIME together
    if (!ext || !allowedFormats.includes(ext)) {
      return res.status(400).json({ message: "Unsupported file type (extension)" });
    }
    if (!mime.startsWith("image/") && !mime.includes("pdf") && !mime.includes("mp4") && !mime.includes("gif")) {
      return res.status(400).json({ message: "Unsupported file type (MIME)" });
    }

    if (req.file.size <= 0) {
      return res.status(400).json({ message: "Invalid file size" });
    }

    next();
  } catch (err) {
    console.error("❌ Validation error:", err);
    res.status(500).json({ message: "Server error during validation" });
  }
};




/src/models/Conversion.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IConversion extends Document {
  user: mongoose.Types.ObjectId;
  fileName: string;
  originalFormat: string;
  convertedFormat: string;
  size: number;
  date: Date;
}

const ConversionSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  fileName: { type: String, required: true },
  originalFormat: { type: String, required: true },
  convertedFormat: { type: String, required: true },
  size: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.model<IConversion>("Conversion", ConversionSchema);


/src/models/User.ts

import { Request, Response } from "express";
import { IUser } from "../models/User";
import Conversion from "../models/Conversion";
import Plan from "../models/Plan";
import User from "../models/User";

interface AuthRequest extends Request {
  user?: IUser;
}

// 📌 Get user info (with plan details)
export const getUserInfo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch plan details if not admin
    let plan = null;
    if (user.role !== "admin") {
      plan = await Plan.findOne({ name: user.role });
    }

    res.json({
      user,
      plan: plan
        ? {
            name: plan.name,
            price: plan.price,
            limit: plan.limit,
          }
        : { name: "Admin", price: 0, limit: "Unlimited" },
    });
  } catch (err) {
    console.error("❌ User info fetch error:", err);
    res.status(500).json({ message: "Server error fetching user info" });
  }
};

// 📌 Get conversion history
export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    let history;

    if (req.user.role === "admin") {
      history = await Conversion.find()
        .populate("userId", "name email role")
        .sort({ date: -1 });
    } else {
      history = await Conversion.find({ userId: req.user._id })
        .sort({ date: -1 })
        .select("fileName originalFormat convertedFormat size date");
    }

    // ✅ Transform `_id` to `id`
    const formatted = history.map((item: any) => ({
      id: item._id.toString(),
      fileName: item.fileName,
      originalFormat: item.originalFormat,
      convertedFormat: item.convertedFormat,
      size: item.size,
      date: item.date,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ History fetch error:", err);
    res.status(500).json({ message: "Server error fetching history" });
  }
};


// 📌 Upgrade Plan
export const upgradePlan = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { planName } = req.body; // e.g. "user" | "paid"

    // 🚫 Admin cannot upgrade/downgrade
    if (req.user.role === "admin") {
      return res
        .status(400)
        .json({ message: "Admins already have unlimited access" });
    }

    // 🔎 Fetch plan
    const plan = await Plan.findOne({ name: planName });
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // 🔎 Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update role to match plan
    user.role = planName;
    await user.save();

    res.json({
      message: `✅ Upgraded to ${planName} plan`,
      plan: {
        name: plan.name,
        price: plan.price,
        limit: plan.limit,
      },
    });
  } catch (err) {
    console.error("❌ Upgrade plan error:", err);
    res.status(500).json({ message: "Server error during upgrade" });
  }
};


src/models/Usage.ts

import { Schema, model, Document } from "mongoose";

export interface IUsage extends Document {
  key: string;          // userId or IP
  role: "guest" | "user" | "paid" | "admin";
  used: number;         // bytes used
  createdAt: Date;      // auto for TTL
}

const usageSchema = new Schema<IUsage>(
  {
    key: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ["guest", "user", "paid", "admin"],
      required: true,
    },
    used: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, expires: "1d" }, 
    // TTL index → auto reset daily
  },
  { timestamps: true }
);

export default model<IUsage>("Usage", usageSchema);


src/models/Contact.ts


import { Schema, model, Document, Types } from "mongoose";

export interface IContact extends Document {
  userId?: Types.ObjectId; // optional, if user is logged in
  name: string;
  email: string;
  message: string;
  createdAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" }, // link to logged-in user
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export default model<IContact>("Contact", contactSchema);



/src/models/Plan.ts


import mongoose, { Document, Schema } from "mongoose";

export interface IPlan extends Document {
  name: "guest" | "user" | "paid" | "admin";
  price: number; // monthly cost in USD
  limit: number; // MB limit
}

const planSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      enum: ["guest", "user", "paid", "admin"],
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    limit: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPlan>("Plan", planSchema);



/src/routes/authRoutes.ts

import express from "express";
import { register, login } from "../controllers/authController";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

export default router;


/src/routes/conversionRoutes.ts

import express from "express";
import { convertFile } from "../controllers/conversionController";
import { rateLimiter } from "../middleware/rateLimiter";
import { upload } from "../utils/fileHandler";

const router = express.Router();

router.post("/", upload.single("file"), rateLimiter, convertFile);

export default router;


/src/routes/paymentRoutes.ts

import { Router } from "express";
import { checkout, adminPayments } from "../controllers/paymentController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// User checkout
router.post("/checkout", protect, checkout);

// Admin check payments
router.get("/admin/payments", protect, adminPayments);

export default router;


src/routes/contactRoutes.ts

import express from "express";
import { createMessage, getMessages } from "../controllers/contactController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

// public (anyone can send message)
router.post("/", createMessage);

// admin only (view messages)
router.get("/", protect, getMessages);

export default router;



/src/routes/userRoutes.ts
// /routes/userRoutes.ts file code

import express from "express";
import { getHistory, upgradePlan, getUserInfo } from "../controllers/userController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

// ✅ history
router.get("/history", protect, getHistory);

// ✅ upgrade plan
router.post("/upgrade", protect, upgradePlan);

// ✅ Get user info (role and conversion count)
router.get("/info", protect, getUserInfo);

export default router;



/src/services/imageService.ts
import sharp from "sharp";

export const convertImage = async (
  inputPath: string,
  outputPath: string,
  format: "png" | "jpg" | "jpeg" | "webp",
  quality: number
) => {
  // Use a different sharp method based on the desired output format and apply the quality setting.
  const sharpInstance = sharp(inputPath);
  
  if (format === "jpeg" || format === "jpg") {
    await sharpInstance.jpeg({ quality }).toFile(outputPath);
  } else if (format === "webp") {
    await sharpInstance.webp({ quality }).toFile(outputPath);
  } else if (format === "png") {
    // PNG is lossless and does not have a quality setting like JPEG/WebP.
    // Instead, we can adjust the compression level, but for simplicity, we'll
    // just pass it through without a quality change.
    await sharpInstance.png().toFile(outputPath);
  } else {
    // Fallback for other formats
    await sharpInstance.toFormat(format).toFile(outputPath);
  }
};


/src/services/pdfService.ts


import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";
//@ts-ignore
import * as poppler from "pdf-poppler";

// ✅ tell Node where Poppler is (your path)
process.env.PATH = process.env.PATH + ";C:\\Users\\Lahori Computers\\Downloads\\poppler-25.07.0\\Library\\bin";

/**
 * Convert PDF pages into PNG images
 */
export const pdfToImages = async (inputPath: string, outputDir: string) => {
  fs.mkdirSync(outputDir, { recursive: true });

  const opts: poppler.ConvertOptions = {
    format: "png",
    out_dir: outputDir,
    out_prefix: path.basename(inputPath, path.extname(inputPath)),
    scale: 1024, // better quality
  };

  await poppler.convert(inputPath, opts);

  const results = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith(".png"))
    .map((f) => path.join(outputDir, f));

  return results;
};

/**
 * Combine images back into a single PDF
 */
export const imagesToPdf = async (images: string[], outputPath: string) => {
  const pdfDoc = await PDFDocument.create();

  for (const imgPath of images) {
    const imageBytes = fs.readFileSync(imgPath);
    let embeddedImage;

    if (imgPath.toLowerCase().endsWith(".jpg") || imgPath.toLowerCase().endsWith(".jpeg")) {
      embeddedImage = await pdfDoc.embedJpg(imageBytes);
    } else {
      embeddedImage = await pdfDoc.embedPng(imageBytes);
    }

    const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: embeddedImage.width,
      height: embeddedImage.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
};



/src/services/videoService.ts
import ffmpeg from "fluent-ffmpeg";

export const convertVideo = async (
  inputPath: string,
  outputPath: string,
  format: "gif" | "mp4",
  quality: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Map a quality number (0-100) to a CRF value (1-51). Lower CRF is better quality.
    // We'll use a simple linear mapping, where 90+ quality is high, and 60 is a decent baseline.
    const crf = 100 - quality; 

    ffmpeg(inputPath)
      // Set the CRF option for better quality control in MP4
      .outputOptions(`-crf ${crf}`)
      .toFormat(format)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
};





/src/utils/cleanup.ts

import fs from "fs";
import path from "path";
import cron from "node-cron";
import { logger } from "./logger";

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

cron.schedule("0 */12 * * *", () => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const file of files) {
      const filePath = path.join(UPLOADS_DIR, file);
      const stats = fs.statSync(filePath);

      const expireTime = Date.now() - 24 * 60 * 60 * 1000;
      if (stats.mtimeMs < expireTime) {
        fs.unlinkSync(filePath);
        logger.info(`🗑️ Deleted old file: ${file}`);
      }
    }
  } catch (err) {
    logger.error(`Cleanup error: ${(err as Error).message}`);
  } finally {
    // future: could add monitoring or alert system here
  }
});



/src/utils/fileHandler.ts
import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
});

export const deleteFile = (filePath: string) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("❌ Failed to delete file:", filePath, err);
    } else {
      console.log(`🗑️ File deleted: ${filePath}`);
    }
  });
};


/src/utils/jwt.ts

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";
const EXPIRES_IN = "7d"; // 🔐 Tokens expire in 7 days

// ✅ Generate JWT
export const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: EXPIRES_IN });
};

// ✅ Verify JWT
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};


/src/utils/logger.ts


import { createLogger, format, transports } from "winston";

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});



/src/validators/conversionValidator.ts

// ✅ Allowed conversion formats
export const allowedFormats = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "heic",
  "gif",
  "mp4",
  "pdf",
];



/src/app.ts

import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes";
import conversionRoutes from "./routes/conversionRoutes";
import userRoutes from "./routes/userRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import { errorHandler } from "./middleware/errorHandler";
import contactRoutes from "./routes/contactRoutes";

// 🚀 New: Import the webhook handler
import { handleWebhook } from "./controllers/webhookController";

const app = express();

app.use(cors());
app.use(morgan("dev"));

// 🚩 New: Add the webhook route before other middleware
// This is critical for Stripe's signature verification.
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

// ✅ Normal middleware and routes after this
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/convert", conversionRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/contact", contactRoutes);

// ✅ Error handler
app.use(errorHandler);

export default app;




/src/server.ts

import dotenv from "dotenv";
import { connectDB } from "./config/db";
import { seedAdmin } from "./config/seedAdmin";
import { logger } from "./utils/logger";
import "./utils/cleanup";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT || 5000;

// ✅ Database connection + Seed Admin
connectDB()
  .then(async () => {
    await seedAdmin();
    logger.info("✅ Admin user checked/seeded");

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error(`❌ DB Connection Failed: ${err.message}`);
    process.exit(1);
  });



/.env file code..

PORT=5000
MONGO_URI=mongodb+srv://sahtisham928_db_user:Z8o6fl93hZ33GWgA@cluster0.kkqcukp.mongodb.net/converterDb?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=Ehtisham@AEIOU$8041122
CLOUDINARY_CLOUD_NAME=durzqqis6
CLOUDINARY_API_KEY=382333732399954
CLOUDINARY_API_SECRET=RMxVKSTH8AJXpywEZw7osSwYe6U
ADMIN_EMAIL=sahtisham928@gmail.com
ADMIN_PASSWORD=shami1221EI

NODE_ENV=development
UPLOAD_LIMIT=10mb


STRIPE_SECRET_KEY=sk_test_1234567890
STRIPE_PRICE_USER=price_123user
STRIPE_PRICE_PAID=price_123paid

/.env.example code ..


PORT=5000
NODE_ENV=development
UPLOAD_LIMIT=10mb

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/converterDb

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin_password

# Stripe (for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PRICE_USER=price_id_for_user_plan
STRIPE_PRICE_PAID=price_id_for_paid_plan


/package.json

{
  "name": "image_converter",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "nodemon --watch src --exec ts-node src/server.ts"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "cloudinary": "^2.7.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.2",
    "express": "^5.1.0",
    "fluent-ffmpeg": "^2.1.3",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.18.1",
    "morgan": "^1.10.1",
    "multer": "^2.0.2",
    "node-cron": "^4.2.1",
    "pdf-lib": "^1.17.1",
    "sharp": "^0.34.3",
    "stripe": "^18.5.0",
    "winston": "^3.17.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.3",
    "@types/fluent-ffmpeg": "^2.1.27",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/mongoose": "^5.11.96",
    "@types/morgan": "^1.9.10",
    "@types/multer": "^2.0.0",
    "@types/node": "^24.3.3",
    "@types/node-cron": "^3.0.11",
    "@types/stripe": "^8.0.416",
    "@types/winston": "^2.4.4",
    "nodemon": "^3.1.10",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.2"
  }
}


/tsconfig.json

{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "strict": true,
    "moduleResolution": "NodeNext",
    "resolveJsonModule": true,
    "skipLibCheck": true,
  }
}
