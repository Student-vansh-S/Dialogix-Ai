/**
 * Thread Model
 * Stores chat conversation threads with embedded messages.
 */
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 50000,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt per message
  }
);

const ThreadSchema = new mongoose.Schema(
  {
    threadId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "New Chat",
      maxlength: 100,
    },
    messages: [MessageSchema],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt (fixes "createAt" typo)
  }
);

// Compound indexes for efficient queries
ThreadSchema.index({ threadId: 1, userId: 1 }, { unique: true });
ThreadSchema.index({ userId: 1, updatedAt: -1 }); // For listing threads sorted by recent

export default mongoose.model("Thread", ThreadSchema);