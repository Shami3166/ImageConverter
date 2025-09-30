import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/User";
import Usage from "../models/Usage";

interface AuthRequest extends Request {
  user?: IUser;
  file?: Express.Multer.File;
}

// ✅ UPDATED LIMITS - Guest: 100MB, User: 800MB, Admin: Unlimited
const limits: Record<string, number> = {
  guest: 100 * 1024 * 1024,     // 100 MB for guest users
  user: 800 * 1024 * 1024,     // 800 MB for logged-in users
  admin: Infinity,             // Unlimited for admin
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
        message: `Daily limit exceeded: ${role === 'guest' ? 'Guest' : 'User'} users can only process up to ${limit / (1024 * 1024)} MB per day.`,
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