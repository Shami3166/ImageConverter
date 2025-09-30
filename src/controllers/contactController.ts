// /src/controllers/contactController.ts
import { Request, Response } from "express";
import Contact from "../models/Contact";
import { IUser } from "../models/User";

interface AuthRequest extends Request {
  user?: IUser;
}

// @desc Create contact message
// @route POST /api/contact
export const createMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const contact = await Contact.create({
      userId: req.user?._id,
      name,
      email,
      message,
    });

    res.status(201).json({
      success: true,
      message: "✅ Message sent successfully",
      data: contact,
    });
  } catch (err) {
    console.error("❌ Contact error:", err);
    res.status(500).json({ message: "Server error sending message" });
  }
};

// @desc Get all contact messages (Admin only)
// @route GET /api/contact
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Contact.find().populate("userId", "name email");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching messages" });
  }
};
