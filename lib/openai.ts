import OpenAI from "openai";

/**
 * Server-side OpenAI client. Use only in API routes or server components.
 * Requires OPENAI_API_KEY in environment.
 */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}
