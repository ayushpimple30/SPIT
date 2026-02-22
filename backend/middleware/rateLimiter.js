import rateLimit from "express-rate-limit";

/**
 * General API rate limiter - no personal data logged, only IP count (in memory).
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: "Too many requests" },
  standardHeaders: true,
  legacyHeaders: false,
});
