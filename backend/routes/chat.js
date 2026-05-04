import express from "express";
import mongoose from "mongoose";
import Thread from "../models/Threads.js";
import getGeminiResponse from "../utils/gemini.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all chat routes
router.use(protect);

// Get all threads (sorted by most recent)
router.get("/thread", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
       return res.json([]); // Return empty threads if DB is down
    }
    const threads = await Thread.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json(threads);
  } catch (err) {
    console.error("Failed to fetch threads:", err);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// Get a specific thread by threadId
router.get("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;
  try {
    if (mongoose.connection.readyState !== 1) {
       return res.json([]);
    }
    const thread = await Thread.findOne({ threadId, userId: req.user._id });
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    res.json(thread.messages);
  } catch (err) {
    console.error("Failed to fetch chat:", err);
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

// Delete a thread
router.delete("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;
  try {
    if (mongoose.connection.readyState !== 1) {
       return res.status(200).json({ success: "Simulated delete successful" });
    }
    const deletedThread = await Thread.findOneAndDelete({ threadId, userId: req.user._id });
    if (!deletedThread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    res.status(200).json({ success: "Thread deleted successfully" });
  } catch (err) {
    console.error("Failed to delete thread:", err);
    res.status(500).json({ error: "Failed to delete thread" });
  }
});

// Send a chat message — creates thread if new, appends if existing
router.post("/chat", async (req, res) => {
  const { threadId, message } = req.body;

  if (!threadId || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // If DB is not connected, bypass DB completely to avoid 10s timeouts
    if (mongoose.connection.readyState !== 1) {
       console.log("DB disconnected, using fallback Gemini response");
       const assistantReply = await getGeminiResponse(message);
       return res.json({ reply: assistantReply });
    }

    let thread = await Thread.findOne({ threadId, userId: req.user._id });

    if (!thread) {
      // Create a new thread with the first user message
      thread = new Thread({
        threadId,
        userId: req.user._id,
        title: message.length > 60 ? message.substring(0, 60) + "..." : message,
        messages: [{ role: "user", content: message }],
      });
    } else {
      thread.messages.push({ role: "user", content: message });
    }

    // Get AI response from Gemini
    const assistantReply = await getGeminiResponse(message);

    try {
      thread.messages.push({ role: "assistant", content: assistantReply });
      thread.updatedAt = new Date();
      await thread.save();
    } catch (dbErr) {
      console.error("MongoDB save skipped due to error:", dbErr.message);
      // Fallback: still return the reply even if DB fails to save
    }

    res.json({ reply: assistantReply });
  } catch (err) {
    console.error("Chat error:", err.message || err);

    // If the error was from DB when trying to find the thread initially, we can still call Gemini
    if (err.name === 'MongooseError' || err.message.includes('buffering timed out') || err.message.includes('topology')) {
      try {
        const fallbackReply = await getGeminiResponse(message);
        return res.json({ reply: fallbackReply });
      } catch (apiErr) {
        return res.status(503).json({ error: apiErr.message || "AI API is unavailable. Please try again." });
      }
    }

    // Surface Gemini high-demand errors with a clear message
    if (err.message && err.message.includes("high demand")) {
      return res.status(503).json({ error: err.message });
    }

    res.status(500).json({ error: "Something went wrong! Please try again." });
  }
});

export default router;