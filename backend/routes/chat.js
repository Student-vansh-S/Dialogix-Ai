/**
 * Chat Routes
 * Handles thread CRUD operations and AI chat messaging.
 */
import express from "express";
import mongoose from "mongoose";
import Thread from "../models/Threads.js";
import getGeminiResponse from "../utils/gemini.js";
import { protect } from "../middleware/authMiddleware.js";
import { chatLimiter, apiLimiter } from "../middleware/rateLimiter.js";
import { validateChat } from "../middleware/validate.js";

const router = express.Router();

// All chat routes require authentication
router.use(protect);

/**
 * @desc    Get all threads for the authenticated user (sorted by most recent)
 * @route   GET /api/thread
 * @access  Private
 */
router.get("/thread", apiLimiter, async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }

    const threads = await Thread.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select("threadId title updatedAt")
      .lean(); // .lean() for read-only performance boost

    res.json(threads);
  } catch (err) {
    next(err);
  }
});

/**
 * @desc    Get a specific thread's messages
 * @route   GET /api/thread/:threadId
 * @access  Private
 */
router.get("/thread/:threadId", apiLimiter, async (req, res, next) => {
  const { threadId } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }

    const thread = await Thread.findOne({
      threadId,
      userId: req.user._id,
    }).lean();

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    res.json(thread.messages);
  } catch (err) {
    next(err);
  }
});

/**
 * @desc    Delete a thread
 * @route   DELETE /api/thread/:threadId
 * @access  Private
 */
router.delete("/thread/:threadId", async (req, res, next) => {
  const { threadId } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database unavailable. Please try again later." });
    }

    const deletedThread = await Thread.findOneAndDelete({
      threadId,
      userId: req.user._id,
    });

    if (!deletedThread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    res.status(200).json({ success: "Thread deleted successfully" });
  } catch (err) {
    next(err);
  }
});

/**
 * @desc    Send a chat message — creates thread if new, appends if existing
 * @route   POST /api/chat
 * @access  Private
 */
router.post("/chat", chatLimiter, validateChat, async (req, res, next) => {
  const { threadId, message } = req.body;

  try {
    // If DB is disconnected, bypass DB to avoid timeouts but still get AI response
    if (mongoose.connection.readyState !== 1) {
      const assistantReply = await getGeminiResponse(message);
      return res.json({ reply: assistantReply });
    }

    let thread = await Thread.findOne({ threadId, userId: req.user._id });

    if (!thread) {
      // Create new thread — sanitize title from user input
      const sanitizedTitle = message
        .replace(/[<>]/g, "") // Strip HTML angle brackets
        .substring(0, 60)
        .trim();

      thread = new Thread({
        threadId,
        userId: req.user._id,
        title: sanitizedTitle + (message.length > 60 ? "..." : ""),
        messages: [{ role: "user", content: message }],
      });
    } else {
      thread.messages.push({ role: "user", content: message });
    }

    // Get AI response from Gemini
    const assistantReply = await getGeminiResponse(message);

    // Save to DB (non-blocking — still return reply even if save fails)
    try {
      thread.messages.push({ role: "assistant", content: assistantReply });
      await thread.save();
    } catch (dbErr) {
      console.error("[DB] Failed to save thread:", dbErr.message);
    }

    res.json({ reply: assistantReply });
  } catch (err) {
    // Handle DB timeout errors — still try to get AI response
    const isDbError =
      err.name === "MongooseError" ||
      (err.message && (err.message.includes("buffering timed out") || err.message.includes("topology")));

    if (isDbError) {
      try {
        const fallbackReply = await getGeminiResponse(req.body.message);
        return res.json({ reply: fallbackReply });
      } catch (apiErr) {
        return res.status(503).json({
          error: apiErr.message || "AI service is unavailable. Please try again.",
        });
      }
    }

    // Surface Gemini high-demand errors clearly
    if (err.message && err.message.includes("high demand")) {
      return res.status(503).json({ error: err.message });
    }

    next(err);
  }
});

export default router;