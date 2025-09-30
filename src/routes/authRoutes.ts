import express from "express";
import { register, login, logout } from "../controllers/authController"; // ✅ ADD logout import

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout); // ✅ ADD logout route

export default router;