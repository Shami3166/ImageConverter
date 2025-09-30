import { Request, Response, NextFunction } from "express";

export const setAuthCookie = (res: Response, token: string) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearAuthCookie = (res: Response) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
  });
};