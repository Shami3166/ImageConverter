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
