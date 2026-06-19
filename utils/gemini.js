/**
 * Re-export Gemini client for scripts that import from utils/gemini.js.
 * Configure GEMINI_API_KEY in .env — never hardcode API keys.
 */
export {
  isGeminiConfigured,
  geminiGenerateText,
  geminiGenerateJson,
  geminiGenerateFromImage,
} from '../lib/ai/gemini.js';
