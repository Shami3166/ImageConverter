import { Request, Response } from "express";
import { IUser } from "../models/User";
import Conversion from "../models/Conversion";
import User from "../models/User";

interface AuthRequest extends Request {
  user?: IUser;
}

export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    let history;

    if (req.user.role === "admin") {
      history = await Conversion.find()
        .populate("user", "name email role")
        .sort({ date: -1 })
        .lean();
    } else {
      history = await Conversion.find({ user: req.user._id })
        .sort({ date: -1 })
        .lean();
    }

    const formattedHistory = history.map((conv: any) => ({
      id: conv._id?.toString(),
      fileName: conv.fileName || "Unknown file",
      originalFormat: conv.originalFormat || "unknown",
      convertedFormat: conv.convertedFormat || "unknown",
      size: conv.size || 0,
      date: conv.date || conv.createdAt,
      user: conv.user ? conv.user : undefined, // admin will get populated user
    }));

    res.json(formattedHistory);
  } catch (err) {
    console.error("❌ History fetch error:", err);
    res.status(500).json({ message: "Server error fetching history" });
  }
};

// 📌 Get user info
export const getUserInfo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ FIX: Get conversion count
    const conversionsUsed = await Conversion.countDocuments({ user: req.user._id });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      role: user.role,
      conversionsUsed, // ← This should now work
      message: "Free account - Unlimited conversions"
    });
  } catch (err) {
    console.error("❌ Get user info error:", err);
    res.status(500).json({ message: "Server error fetching user info" });
  }
};

// 📌 REMOVED: upgradePlan function - No payments needed