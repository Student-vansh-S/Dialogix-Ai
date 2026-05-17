/**
 * Gemini AI Utility
 * Sends messages to Google Gemini API with retry logic,
 * model fallback chain, and request timeouts.
 */
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Fallback model chain — tries each model in order when one is unavailable
const MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 30000; // 30 second timeout per API call
const MAX_MESSAGE_LENGTH = 10000;

/**
 * Returns true if the error is a transient 503/UNAVAILABLE error
 * that is safe to retry or fall back from.
 */
const isUnavailableError = (err) => {
  const msg = (err.message || "").toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("overloaded")
  );
};

/**
 * Sleep for a given number of milliseconds.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps a promise with a timeout. Rejects if the promise doesn't
 * resolve within the specified duration.
 */
const withTimeout = (promise, ms) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

/**
 * Tries a single Gemini model with exponential-backoff retries.
 * Each attempt has a 30s timeout.
 */
const tryModelWithRetry = async (model, message) => {
  let lastErr;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: message,
        }),
        REQUEST_TIMEOUT_MS
      );

      return response.text;
    } catch (err) {
      lastErr = err;

      if (!isUnavailableError(err) && !err.message.includes("timed out")) {
        throw err; // Non-transient error — no point retrying
      }

      const delay = BASE_DELAY_MS * Math.pow(2, attempt); // 1s, 2s, 4s
      console.warn(
        `[Gemini] Model "${model}" unavailable (attempt ${attempt + 1}/${MAX_RETRIES}). Retrying in ${delay}ms…`
      );
      await sleep(delay);
    }
  }

  throw lastErr;
};

/**
 * Sends a message to Google Gemini and returns the AI response text.
 * Automatically retries with exponential backoff and falls back through
 * the MODEL_CHAIN when a 503 / high-demand error is encountered.
 *
 * @param {string} message - The user's message to send to Gemini
 * @returns {Promise<string>} The AI-generated response text
 * @throws {Error} If the message is empty/too long or all models fail
 */
const getGeminiResponse = async (message) => {
  if (!message || typeof message !== "string") {
    throw new Error("Message is required and must be a string");
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
  }

  let lastErr;

  for (const model of MODEL_CHAIN) {
    try {
      console.log(`[Gemini] Using model: ${model}`);
      const text = await tryModelWithRetry(model, message);
      return text;
    } catch (err) {
      lastErr = err;

      if (isUnavailableError(err) || (err.message && err.message.includes("timed out"))) {
        console.warn(
          `[Gemini] Model "${model}" exhausted all retries. Trying next fallback…`
        );
        continue;
      }

      // Non-transient error — surface immediately
      console.error("[Gemini] API Error:", err.message || err);
      throw new Error("Failed to get response from Gemini API");
    }
  }

  // All models exhausted
  console.error("[Gemini] All models in the fallback chain are unavailable.");
  throw new Error(
    "Gemini API is currently experiencing high demand. Please try again in a moment."
  );
};

export default getGeminiResponse;
