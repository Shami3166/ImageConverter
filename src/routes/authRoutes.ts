import express from "express";
import { register, login, logout } from "../controllers/authController";

const router = express.Router();

// Main auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Add this debug route (CORRECTED VERSION)
router.get('/debug-cookies', (req: express.Request, res: express.Response) => {
  console.log('🔍 Debug cookies - All cookies:', req.cookies);
  console.log('🔍 Debug cookies - Auth token:', req.cookies?.auth_token);
  console.log('🔍 Debug cookies - Headers:', req.headers);
  
  res.json({
    cookiesReceived: req.cookies,
    authToken: req.cookies?.auth_token,
    headers: {
      cookie: req.headers.cookie,
      origin: req.headers.origin,
      referer: req.headers.referer
    }
  });
});

export default router;