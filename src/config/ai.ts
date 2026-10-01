import { google } from "@ai-sdk/google";

/**
 * SINGLE SOURCE OF TRUTH for AI Model selection.
 * To change or upgrade the model across the codebase, edit this single line.
 * It also supports overriding via the AI_MODEL environment variable without code changes.
 */
export const DEFAULT_AI_MODEL = process.env.AI_MODEL || "gemini-3.5-flash";

/**
 * Returns the initialized provider model instance.
 */
export function getAiModel() {
  return google(DEFAULT_AI_MODEL);
}
