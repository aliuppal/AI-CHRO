import "server-only";
import { generateText } from "ai";
import { cacheLife, cacheTag } from "next/cache";

import { FREE_MODELS, freeModel } from "@/lib/ai";
import { getOpenAlerts } from "@/lib/data/alerts";
import { getDashboardMetrics } from "@/lib/data/dashboard";

export const briefingTag = (organizationId: string) => `briefing:${organizationId}`;

export type Briefing = { summary: string; model: string; generatedAt: string };

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

/**
 * Today's AI summary. Cached per organization per day (the `day` argument is part
 * of the cache key) and tagged so "Regenerate" can expire it. Throws on model
 * failure so an error is never cached.
 */
export async function getDailyBriefing(organizationId: string, day: string): Promise<Briefing> {
  "use cache";
  cacheTag(briefingTag(organizationId));
  cacheLife("hours");

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

  const prompt = facts.join("\n") + "\n\nWrite today's briefing in exactly 2 sentences, at most 60 words in total.";

  // Free models sometimes return nothing (rate limits, or reasoning that eats the budget).
  // Try each free model in turn until one gives a usable answer.
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
      if (summary) return { summary, model: response.modelId, generatedAt: new Date().toISOString() };
      console.warn("Daily briefing: empty answer from " + id);
    } catch (error) {
      console.warn("Daily briefing: " + id + " failed", error);
    }
  }
  throw new Error("Every free model failed to write the briefing");
}
