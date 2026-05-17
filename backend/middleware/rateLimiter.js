/**
 * Rate Limiting Middleware
 * Configurable presets to protect against brute-force, DDoS, and spam.
 */
import rateLimit from "express-rate-limit";

/**
 * Global rate limiter — applies to all routes.
 * 100 requests per 15 minutes per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    error: "Too many requests. Please try again later.",
    retryAfter: "15 minutes",
  },
});

/**
 * Login rate limiter — strict to prevent brute-force.
 * 5 attempts per 15 minutes per IP.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  message: {
    error: "Too many login attempts. Please try again after 15 minutes.",
    retryAfter: "15 minutes",
  },
});

/**
 * Signup rate limiter — prevents mass account creation.
 * 3 signups per hour per IP.
 */
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many accounts created. Please try again after 1 hour.",
    retryAfter: "1 hour",
  },
});

/**
 * Chat rate limiter — prevents AI API abuse.
 * 30 messages per minute per IP.
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Message rate limit reached. Please slow down.",
    retryAfter: "1 minute",
  },
});

/**
 * General API rate limiter — for read-heavy endpoints.
 * 60 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "API rate limit reached. Please try again shortly.",
    retryAfter: "1 minute",
  },
});
