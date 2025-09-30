// /src/routes/contactRoutes.ts
import express from "express";
import { createMessage, getMessages } from "../controllers/contactController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

// public (anyone can send message)
router.post("/", createMessage);

// admin only (view messages)
router.get("/", protect, getMessages);

export default router;
