import { Response } from "express";

export const setAuthCookie = (res: Response, token: string) => {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true, // ✅ Must be true for HTTPS
    sameSite: "none", // ✅ Must be "none" for cross-domain
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // ✅ REMOVE domain property completely
  });
};

export const clearAuthCookie = (res: Response) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    // ✅ REMOVE domain property completely
  });
};