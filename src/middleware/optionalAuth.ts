import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { verifyToken } from "../utils/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export interface AuthRequest extends Request {
  user?: any;
}

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token;

  // Check cookies first
  if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }
  // Fallback to Authorization header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    // ✅ NO TOKEN = GUEST USER, continue without user
    console.log("🔓 Guest user access");
    return next();
  }

  try {
    const decoded: any = verifyToken(token);
    if (decoded) {
      req.user = await User.findById(decoded.id).select("-password");
      console.log("🔐 Authenticated user:", req.user?.email);
    }
    next();
  } catch (err) {
    // ✅ TOKEN INVALID = GUEST USER, continue without user
    console.log("🔓 Invalid token, treating as guest user");
    next();
  }
};