import "server-only";
import type { AlertType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { priorityFromRisk, type Priority } from "@/lib/priority";

export type AlertItem = {
  id: string;
  title: string;
  reason: string;
  priority: Priority;
  href: string;
  createdAt: Date;
  nextAction?: string;
};

const hrefByType: Record<AlertType, string> = {
  BURNOUT: "/employees",
  FLIGHT_RISK: "/employees",
  ENGAGEMENT_DROP: "/employees",
  HIRING: "/talent",
  COMPLIANCE: "/policies",
};

const rank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/** Open alerts, most urgent first. Call after connection(): this is request-time data. */
export async function getOpenAlerts(organizationId: string): Promise<AlertItem[]> {
  const rows = await db.riskAlert.findMany({
    where: { organizationId, status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return rows
    .map((row) => {
      const actions = Array.isArray(row.suggestedActions)
        ? (row.suggestedActions as { action?: string }[])
        : [];
      return {
        id: row.id,
        title: row.title,
        reason: row.reason,
        priority: priorityFromRisk(row.level),
        href: hrefByType[row.type],
        createdAt: row.createdAt,
        nextAction: actions[0]?.action,
      };
    })
    .sort((a, b) => rank[a.priority] - rank[b.priority] || b.createdAt.getTime() - a.createdAt.getTime());
}

export function relativeAge(date: Date, now = Date.now()) {
  const minutes = Math.max(1, Math.round((now - date.getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}
