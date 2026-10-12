import "server-only";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// Project rule: only OpenRouter free-tier models (ids ending in ":free").
const DEFAULT_MODEL_ID = "nvidia/nemotron-3-super-120b-a12b:free";

function freeModel(id: string | undefined, envName: string) {
  if (!id) return undefined;
  if (!id.endsWith(":free")) {
    throw new Error(`${envName}="${id}" is not a free OpenRouter model (must end in ":free")`);
  }
  return id;
}

export const openrouter = createOpenRouter({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  appName: "AI CHRO",
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
});

export const MODEL_ID = freeModel(process.env.OPENROUTER_MODEL, "OPENROUTER_MODEL") ?? DEFAULT_MODEL_ID;
const FALLBACK_MODEL_ID = freeModel(process.env.OPENROUTER_FALLBACK_MODEL, "OPENROUTER_FALLBACK_MODEL");

/** Chat model for all generation. Free models get rate-limited, so OpenRouter
 *  falls through to the fallback model when one is configured. */
export const chatModel = openrouter.chat(MODEL_ID, {
  ...(FALLBACK_MODEL_ID && { models: [MODEL_ID, FALLBACK_MODEL_ID] }),
});
