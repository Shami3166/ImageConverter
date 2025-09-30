import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import User from "../models/User";
import { generateToken } from "../utils/jwt";
import { setAuthCookie, clearAuthCookie } from "../middleware/cookieMiddleware";
import Conversion from "../models/Conversion";

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

    // ✅ FIX: Get conversion count for this user (will be 0 for new user)
    const conversionCount = await Conversion.countDocuments({ user: user._id });

    // Generate token
    const token = generateToken((user._id as Types.ObjectId).toString(), user.role);

    // Set HttpOnly cookie
    setAuthCookie(res, token);

    // ✅ FIX: Return conversion count
    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      conversionsUsed: conversionCount // ← ADD THIS LINE
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
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

    // ✅ FIX: Get conversion count for this user
    const conversionCount = await Conversion.countDocuments({ user: user._id });

    // Generate token
    const token = generateToken((user._id as Types.ObjectId).toString(), user.role);

    // Set HttpOnly cookie
    setAuthCookie(res, token);

    // ✅ FIX: Return conversion count
    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      conversionsUsed: conversionCount // ← ADD THIS LINE
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// @desc Logout user
// @route POST /api/auth/logout
export const logout = async (req: Request, res: Response) => {
  try {
    // Clear the HttpOnly cookie
    clearAuthCookie(res);
    
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};