import "server-only";
import { cache } from "react";

import { db } from "@/lib/db";

const DAY = 86_400_000;

export type GenderKey = "woman" | "man" | "nonBinary" | "undisclosed";

export type DashboardMetrics = {
  headcount: { current: number; yearAgo: number; trend: { month: string; value: number }[] };
  attrition: { month: string; rate: number; exits: number }[];
  retentionRisk: { atRisk: number; share: number };
  timeToFill: { medianDays: number | null; roles: number; open: number };
  representation: { womenAndNonBinary: number | null; disclosed: number };
  diversity: ({ department: string; total: number } & Record<GenderKey, number>)[];
  enps: { score: number | null; previous: number | null; responses: number; surveyTitle: string | null };
};

function genderKey(value: string | null): GenderKey {
  if (value === "Woman") return "woman";
  if (value === "Man") return "man";
  if (value === "Non-binary") return "nonBinary";
  return "undisclosed";
}

function enpsOf(scores: (number | null)[]) {
  const valid = scores.filter((s): s is number => s !== null);
  if (valid.length === 0) return null;
  const promoters = valid.filter((s) => s >= 9).length;
  const detractors = valid.filter((s) => s <= 6).length;
  return Math.round(((promoters - detractors) / valid.length) * 100);
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** All headline metrics for one organization. Request-time data: call after connection(). */
async function loadDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
  const now = new Date();
  const [employees, departments, postings, surveys] = await Promise.all([
    db.employee.findMany({
      where: { organizationId },
      select: { startDate: true, endDate: true, status: true, departmentId: true, genderIdentity: true, riskLevel: true },
    }),
    db.department.findMany({ where: { organizationId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.jobPosting.findMany({ where: { organizationId }, select: { status: true, openedAt: true, filledAt: true } }),
    db.pulseSurvey.findMany({
      where: { organizationId, responses: { some: {} } },
      orderBy: { opensAt: "desc" },
      take: 2,
      select: { title: true, responses: { select: { enpsScore: true } } },
    }),
  ]);

  const headcountAt = (t: Date) =>
    employees.filter((e) => e.startDate <= t && (!e.endDate || e.endDate > t)).length;

  // Month-end points for the last 12 months; the current month ends today.
  const monthEnds = Array.from({ length: 12 }, (_, i) => {
    const offset = 11 - i;
    return offset === 0 ? now : new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59);
  });
  const label = (d: Date) => d.toLocaleString("en-US", { month: "short" });

  const trend = monthEnds.map((end) => ({ month: label(end), value: headcountAt(end) }));

  // Trailing-12-month attrition: exits in the year to each month end / average headcount.
  const attrition = monthEnds.map((end) => {
    const start = new Date(end.getTime() - 365 * DAY);
    const exits = employees.filter((e) => e.endDate && e.endDate > start && e.endDate <= end).length;
    const avg = (headcountAt(start) + headcountAt(end)) / 2;
    return { month: label(end), rate: avg ? Math.round((exits / avg) * 1000) / 10 : 0, exits };
  });

  const current = employees.filter((e) => e.status !== "TERMINATED");
  const atRisk = current.filter((e) => e.riskLevel === "HIGH" || e.riskLevel === "CRITICAL").length;

  const yearAgo = new Date(now.getTime() - 365 * DAY);
  const fillDays = postings
    .filter((p) => p.status === "FILLED" && p.openedAt && p.filledAt && p.filledAt >= yearAgo)
    .map((p) => Math.round((p.filledAt!.getTime() - p.openedAt!.getTime()) / DAY));

  const disclosed = current.filter((e) => genderKey(e.genderIdentity) !== "undisclosed");
  const womenAndNb = disclosed.filter((e) => ["woman", "nonBinary"].includes(genderKey(e.genderIdentity))).length;

  const diversity = departments
    .map((d) => {
      const people = current.filter((e) => e.departmentId === d.id);
      const counts: Record<GenderKey, number> = { woman: 0, man: 0, nonBinary: 0, undisclosed: 0 };
      for (const e of people) counts[genderKey(e.genderIdentity)]++;
      return { department: d.name, total: people.length, ...counts };
    })
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);

  const [latest, previous] = surveys;

  return {
    headcount: { current: current.length, yearAgo: headcountAt(yearAgo), trend },
    attrition,
    retentionRisk: { atRisk, share: current.length ? atRisk / current.length : 0 },
    timeToFill: {
      medianDays: median(fillDays),
      roles: fillDays.length,
      open: postings.filter((p) => p.status === "OPEN").length,
    },
    representation: {
      womenAndNonBinary: disclosed.length ? womenAndNb / disclosed.length : null,
      disclosed: current.length ? disclosed.length / current.length : 0,
    },
    diversity,
    enps: {
      score: latest ? enpsOf(latest.responses.map((r) => r.enpsScore)) : null,
      previous: previous ? enpsOf(previous.responses.map((r) => r.enpsScore)) : null,
      responses: latest?.responses.length ?? 0,
      surveyTitle: latest?.title ?? null,
    },
  };
}

/** Deduplicated per request, so the KPI row, charts and briefing share one set of queries. */
export const getDashboardMetrics = cache(loadDashboardMetrics);
