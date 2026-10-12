<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Design system
All UI follows `DESIGN.md` (Supabaze-inspired): white canvas, near-black ink `#171717`, a single emerald `#3ecf8e`
primary with near-black text on it, 6px button radius, 12px card radius, display weight 500 with negative tracking.
Keep emerald scarce (one filled green CTA per viewport). Status colours belong in charts and badges only.

## AI models
Use OpenRouter **free models only** (ids ending in `:free`). `src/lib/ai.ts` throws on any other id — never
remove that guard or add a paid model. Import `chatModel` from `@/lib/ai` rather than creating new providers.
