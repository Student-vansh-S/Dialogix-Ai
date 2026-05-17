/**
 * Authentication Routes
 * Handles signup, login, and profile endpoints with rate limiting and validation.
 */
import express from "express";
import { signupUser, loginUser, getProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { loginLimiter, signupLimiter } from "../middleware/rateLimiter.js";
import { validateSignup, validateLogin } from "../middleware/validate.js";

const router = express.Router();

// Public routes with rate limiting and validation
router.post("/signup", signupLimiter, validateSignup, signupUser);
router.post("/login", loginLimiter, validateLogin, loginUser);

// Protected routes
router.get("/profile", protect, getProfile);

export default router;
