/**
 * Validation Middleware
 * Reusable validation chains for all API endpoints using express-validator.
 */
import { body, validationResult } from "express-validator";

/**
 * Middleware to check validation results and return errors.
 * Place after validation chain arrays in route definitions.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({ error: messages[0], details: messages });
  }
  next();
};

/**
 * Validation chain for user signup.
 */
export const validateSignup = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .escape(),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  handleValidationErrors,
];

/**
 * Validation chain for user login.
 */
export const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  handleValidationErrors,
];

/**
 * Validation chain for chat messages.
 */
export const validateChat = [
  body("threadId")
    .trim()
    .notEmpty()
    .withMessage("Thread ID is required")
    .isLength({ max: 100 })
    .withMessage("Invalid thread ID"),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 10000 })
    .withMessage("Message must not exceed 10,000 characters"),
  handleValidationErrors,
];
