/**
 * Authentication Middleware
 * Protects routes by verifying JWT tokens from the Authorization header.
 */
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  // Extract token from "Bearer <token>" header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authorized, no token provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Not authorized, malformed token" });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB (exclude password hash)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ error: "Not authorized, user not found" });
    }

    // Attach user to request object for downstream handlers
    req.user = user;
    next();
  } catch (error) {
    // Differentiate between expired and invalid tokens
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please log in again." });
    }
    return res.status(401).json({ error: "Not authorized, invalid token" });
  }
};

export { protect };
