import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";
const EXPIRES_IN = "7d"; // 🔐 Tokens expire in 7 days

// ✅ Generate JWT
export const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: EXPIRES_IN });
};

// ✅ Verify JWT
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};