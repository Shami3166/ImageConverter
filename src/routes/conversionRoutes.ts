import express from "express";
import { convertFile } from "../controllers/conversionController";
import { optionalAuth } from "../middleware/optionalAuth"; // ✅ NEW: Use optionalAuth instead of protect
import { rateLimiter } from "../middleware/rateLimiter";
import { upload } from "../utils/fileHandler";

const router = express.Router();

// ✅ ALLOW GUEST USERS: Use optionalAuth instead of protect
router.post("/", optionalAuth, upload.single("file"), rateLimiter, convertFile);

export default router;