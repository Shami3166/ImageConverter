import { Request, Response, NextFunction } from "express";

export const setAuthCookie = (res: Response, token: string) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax", // ✅ Change to "none" for cross-domain
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: isProduction ? ".onrender.com" : undefined // ✅ Add domain for production
  });
};

export const clearAuthCookie = (res: Response) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax", // ✅ Change to "none"
    domain: isProduction ? ".onrender.com" : undefined // ✅ Add domain for production
  });
};