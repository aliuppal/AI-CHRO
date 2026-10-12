import type { RiskLevel } from "@/generated/prisma/enums";

export type Priority = "high" | "medium" | "low";

export function priorityFromRisk(level: RiskLevel): Priority {
  if (level === "CRITICAL" || level === "HIGH") return "high";
  if (level === "MEDIUM") return "medium";
  return "low";
}
