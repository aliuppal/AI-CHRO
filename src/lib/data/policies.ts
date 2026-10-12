import "server-only";
import type { ComplianceStatus, PolicyStatus } from "@/generated/prisma/enums";
import type { Tone } from "@/components/status-dot";
import { db } from "@/lib/db";

export const POLICY_STATUS: Record<PolicyStatus, { tone: Tone; label: string }> = {
  DRAFT: { tone: "neutral", label: "Draft" },
  IN_REVIEW: { tone: "warning", label: "In review" },
  PUBLISHED: { tone: "positive", label: "Published" },
  ARCHIVED: { tone: "neutral", label: "Archived" },
};

export const COMPLIANCE: Record<ComplianceStatus, { tone: Tone; label: string }> = {
  NOT_CHECKED: { tone: "neutral", label: "Not checked" },
  PASSED: { tone: "positive", label: "No issues found" },
  WARNINGS: { tone: "warning", label: "Warnings" },
  FAILED: { tone: "negative", label: "Issues found" },
};

export const CATEGORIES = [
  { value: "remote-work", label: "Remote work" },
  { value: "pto", label: "Time off" },
  { value: "leave", label: "Leave" },
  { value: "code-of-conduct", label: "Code of conduct" },
  { value: "finance", label: "Expenses and finance" },
  { value: "security", label: "Security and data" },
  { value: "other", label: "Other" },
];

export const categoryLabel = (value: string) => CATEGORIES.find((c) => c.value === value)?.label ?? value;

export function listPolicies(organizationId: string) {
  return db.policy.findMany({
    where: { organizationId, status: { not: "ARCHIVED" } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      complianceStatus: true,
      region: true,
      country: true,
      version: true,
      content: true,
      updatedAt: true,
      publishedAt: true,
    },
  });
}

export function getPolicy(id: string, organizationId: string) {
  return db.policy.findFirst({ where: { id, organizationId }, include: { author: { select: { name: true } } } });
}

/** First paragraph of the policy body, for the card preview. */
export function excerpt(markdown: string) {
  const line = markdown
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#") && !l.startsWith("-"));
  return line ? line.slice(0, 160) : "";
}
