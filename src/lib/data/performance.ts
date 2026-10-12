import "server-only";
import { db } from "@/lib/db";

export async function getCurrentCycle(organizationId: string) {
  const latest = await db.performanceReview.findFirst({
    where: { organizationId },
    orderBy: { periodEnd: "desc" },
    select: { cycleName: true },
  });
  return latest?.cycleName ?? null;
}

export function listReviews(organizationId: string, cycleName: string) {
  return db.performanceReview.findMany({
    where: { organizationId, cycleName },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      status: true,
      rating: true,
      updatedAt: true,
      submittedAt: true,
      employee: { select: { firstName: true, lastName: true, jobTitle: true, department: { select: { name: true } } } },
      reviewer: { select: { firstName: true, lastName: true } },
    },
  });
}
