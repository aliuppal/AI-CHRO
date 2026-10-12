import "server-only";
import { generateText } from "ai";

import { FREE_MODELS, freeModel } from "@/lib/ai";
import { getOpenAlerts } from "@/lib/data/alerts";
import { getDashboardMetrics } from "@/lib/data/dashboard";
import { db } from "@/lib/db";

/** Why there is no AI summary. "daily-limit" = the OpenRouter free-model quota for today is used up. */
export type BriefingFailure = "daily-limit" | "unavailable";

export type BriefingState =
  | { status: "ready"; summary: string; model: string; generatedAt: Date }
  | { status: "failed"; reason: BriefingFailure };

/** After a failed attempt, wait this long before the dashboard asks the AI again. */
const RETRY_AFTER_MS = 15 * 60_000;

const SYSTEM = [
  "You are the Chief People Officer's chief of staff at a growing company.",
  "You write a short morning briefing for the head of people.",
  "Be warm, direct and specific. Lead with the most urgent item and say what to do first.",
  "Use only the facts provided. Never invent numbers, names or causes.",
  "Never speculate about anyone's health, family or personal life; describe signals, not diagnoses.",
  "Refer to individuals by name or with they/them. Never assume anyone's gender or pronouns.",
  "Plain text only: no markdown, no bullet points, no headings.",
].join(" ");

function clean(text: string) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/[*_#`>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);
}

async function buildPrompt(organizationId: string, day: string) {
  const [alerts, m] = await Promise.all([getOpenAlerts(organizationId), getDashboardMetrics(organizationId)]);
  const latestAttrition = m.attrition.at(-1);

  const facts = [
    `Date: ${day}.`,
    `Headcount: ${m.headcount.current} (was ${m.headcount.yearAgo} a year ago).`,
    latestAttrition && `Attrition over the last 12 months: ${latestAttrition.rate}% (${latestAttrition.exits} exits).`,
    `People at high retention risk: ${m.retentionRisk.atRisk}.`,
    m.enps.score !== null &&
      `eNPS from the ${m.enps.surveyTitle}: ${m.enps.score}${m.enps.previous !== null ? ` (previous survey: ${m.enps.previous})` : ""}, ${m.enps.responses} responses.`,
    m.timeToFill.medianDays !== null &&
      `Median time to fill: ${m.timeToFill.medianDays} days. Open roles: ${m.timeToFill.open}.`,
    "Open alerts, most urgent first:",
    ...alerts.map((a) => `- [${a.priority}] ${a.title}. ${a.reason}${a.nextAction ? ` Suggested: ${a.nextAction}.` : ""}`),
  ].filter(Boolean);

  return facts.join("\n") + "\n\nWrite today's briefing in exactly 2 sentences, at most 60 words in total.";
}

type Generated = { ok: true; summary: string; model: string } | { ok: false; reason: BriefingFailure };

/** Ask the free models, in order, until one writes a usable briefing. */
async function generate(organizationId: string, day: string): Promise<Generated> {
  const prompt = await buildPrompt(organizationId, day);
  for (const id of FREE_MODELS) {
    try {
      const { text, response } = await generateText({
        model: freeModel(id),
        system: SYSTEM,
        prompt,
        maxOutputTokens: 1500,
        maxRetries: 0,
      });
      const summary = clean(text);
      if (summary) return { ok: true, summary, model: response.modelId };
      console.warn("Daily briefing: empty answer from " + id);
    } catch (error) {
      console.warn("Daily briefing: " + id + " failed", error);
      // The free-model daily limit is per OpenRouter account, so the other free models would fail too.
      if (String(error).includes("free-models-per-day")) return { ok: false, reason: "daily-limit" };
    }
  }
  return { ok: false, reason: "unavailable" };
}

async function save(organizationId: string, day: string, result: Generated) {
  const data = result.ok
    ? { summary: result.summary, model: result.model, error: null, generatedAt: new Date() }
    : { summary: null, model: null, error: result.reason, generatedAt: new Date() };
  return db.dailyBriefing.upsert({
    where: { organizationId_day: { organizationId, day } },
    create: { organizationId, day, ...data },
    update: data,
  });
}

function toState(row: { summary: string | null; model: string | null; error: string | null; generatedAt: Date }): BriefingState {
  if (row.summary) return { status: "ready", summary: row.summary, model: row.model ?? "", generatedAt: row.generatedAt };
  return { status: "failed", reason: row.error === "daily-limit" ? "daily-limit" : "unavailable" };
}

/**
 * Today's briefing. Stored in the database, so the AI is asked at most once per
 * organization per day (plus one retry every 15 minutes after a failure),
 * no matter how many servers or page views there are.
 */
export async function getDailyBriefing(organizationId: string, day: string): Promise<BriefingState> {
  const existing = await db.dailyBriefing.findUnique({ where: { organizationId_day: { organizationId, day } } });
  if (existing?.summary) return toState(existing);
  if (existing && Date.now() - existing.generatedAt.getTime() < RETRY_AFTER_MS) return toState(existing);
  return toState(await save(organizationId, day, await generate(organizationId, day)));
}

/**
 * "Regenerate": always asks the AI again. If that fails, a briefing that already
 * exists is kept, and the caller is told why the new draft could not be written.
 */
export async function regenerateDailyBriefing(organizationId: string, day: string): Promise<BriefingState> {
  const result = await generate(organizationId, day);
  if (result.ok) return toState(await save(organizationId, day, result));

  const existing = await db.dailyBriefing.findUnique({ where: { organizationId_day: { organizationId, day } } });
  if (!existing?.summary) await save(organizationId, day, result);
  return { status: "failed", reason: result.reason };
}

export function failureMessage(reason: BriefingFailure) {
  return reason === "daily-limit"
    ? "Today's free AI limit is used up, so there is no new AI summary. It resets at midnight UTC."
    : "The free AI models are busy right now. TalentMind will try again in a few minutes, or use Regenerate.";
}
