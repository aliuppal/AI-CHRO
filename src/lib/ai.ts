import "server-only";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

/**
 * Project rule: OpenRouter FREE models only (ids ending in ":free").
 * Order matters: the first model answers, the next ones are fallbacks.
 * Tested 2026-10-12. Apodex 1.1 Mini is left out: it returns empty answers.
 */
const DEFAULT_FREE_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3.5-lightning:free",
  "liquid/lfm-2.5-2.6b:free",
];

function configuredModels() {
  // OPENROUTER_MODELS="a:free,b:free,c:free". The older single-model variables still work.
  const raw =
    process.env.OPENROUTER_MODELS ??
    [process.env.OPENROUTER_MODEL, process.env.OPENROUTER_FALLBACK_MODEL].filter(Boolean).join(",");
  const models = raw
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const list = models.length > 0 ? models : DEFAULT_FREE_MODELS;
  for (const id of list) {
    if (!id.endsWith(":free")) throw new Error('"' + id + '" is not a free OpenRouter model (must end in ":free")');
  }
  return list;
}

export const FREE_MODELS = configuredModels();
export const MODEL_ID = FREE_MODELS[0];

export const openrouter = createOpenRouter({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  appName: "AI CHRO",
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
});

// Free models here are reasoning models. Keep thinking short so it cannot use
// up the whole answer budget (which produced empty replies), and hide it.
const REASONING = { effort: "low", exclude: true } as const;

/** One specific free model, no fallbacks. */
export function freeModel(id: string) {
  return openrouter.chat(id, { reasoning: REASONING });
}

/**
 * The default model with OpenRouter fallbacks: if the first free model errors
 * or is rate-limited, OpenRouter tries the next (it accepts at most 3).
 */
export const chatModel = openrouter.chat(MODEL_ID, {
  models: FREE_MODELS.slice(0, 3),
  reasoning: REASONING,
});
