import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client with the API key from environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Fallback model chain — tries each in order when a model is unavailable
const MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1 second base delay for exponential backoff

/**
 * Returns true if the error is a transient 503 / UNAVAILABLE error
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
 * Tries a single Gemini model with exponential-backoff retries.
 * Throws the last error if all retries are exhausted.
 */
const tryModelWithRetry = async (model, message) => {
  let lastErr;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: message,
      });
      return response.text;
    } catch (err) {
      lastErr = err;
      if (!isUnavailableError(err)) {
        // Not a transient error — no point retrying
        throw err;
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
 * @throws {Error} If the message is empty or all models/retries fail
 */
const getGeminiResponse = async (message) => {
  if (!message) {
    throw new Error("Message is required");
  }

  let lastErr;
  for (const model of MODEL_CHAIN) {
    try {
      console.log(`[Gemini] Using model: ${model}`);
      const text = await tryModelWithRetry(model, message);
      return text;
    } catch (err) {
      lastErr = err;
      if (isUnavailableError(err)) {
        console.warn(
          `[Gemini] Model "${model}" exhausted all retries. Trying next fallback…`
        );
        continue; // Try the next model in the chain
      }
      // Non-transient error — surface it immediately
      console.error("Gemini API Error:", err.message || err);
      throw new Error("Failed to get response from Gemini API");
    }
  }

  // All models failed
  console.error("[Gemini] All models in the fallback chain are unavailable.");
  throw new Error(
    "Gemini API is currently experiencing high demand. Please try again in a moment."
  );
};

export default getGeminiResponse;

