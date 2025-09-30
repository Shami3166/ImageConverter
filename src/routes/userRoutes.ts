import express from "express";
import { getHistory, getUserInfo } from "../controllers/userController"; // ✅ Remove upgradePlan import
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

// ✅ history
router.get("/history", protect, getHistory);

// ✅ Get user info (role and conversion count)
router.get("/info", protect, getUserInfo);

// ❌ REMOVED: upgrade route - No payments needed

export default router;