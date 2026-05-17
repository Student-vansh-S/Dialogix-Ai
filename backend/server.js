import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import hpp from "hpp";
import morgan from "morgan";
import "dotenv/config";
import mongoose from "mongoose";

import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/authRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import { globalLimiter } from "./middleware/rateLimiter.js";

const app = express();
const PORT = process.env.PORT || 8080;
const isProduction = process.env.NODE_ENV === "production";

// ==============================================
// Security Middleware
// ==============================================

// Helmet — sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
app.use(helmet());

// CORS — whitelist allowed origins
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, health checks)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Request body parsing with size limit (prevents payload attacks)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// HTTP Parameter Pollution protection
app.use(hpp());

// Gzip/Brotli compression for responses
app.use(compression());

// HTTP request logging
app.use(morgan(isProduction ? "combined" : "dev"));

// Global rate limiting — 100 requests per 15 minutes per IP
app.use(globalLimiter);

// ==============================================
// Routes
// ==============================================

app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

// Health check endpoint with DB status
app.get("/", (_req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "ok",
    service: "Dialogix AI Backend",
    database: dbStatus,
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  });
});

// Health check for deployment platforms (Render, Railway, etc.)
app.get("/health", (_req, res) => {
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    healthy: mongoose.connection.readyState === 1,
  });
});

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Centralized error handler (must be last middleware)
app.use(errorHandler);

// ==============================================
// Database Connection
// ==============================================

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 10000, // Fail fast if DB unreachable
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    console.warn(
      "⚠️  Server will start without DB. Database features will fail."
    );
  }
};

// Reconnect handler
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected. Attempting reconnection...");
});
mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected");
});

// ==============================================
// Start Server
// ==============================================

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} [${isProduction ? "production" : "development"}]`);
  });

  // Graceful shutdown handler
  const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log("✅ MongoDB connection closed");
      } catch (err) {
        console.error("Error closing MongoDB:", err.message);
      }
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error("⚠️  Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

startServer();