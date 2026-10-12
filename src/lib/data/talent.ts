import "server-only";
import type { ApplicationStage } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const STAGES: { stage: ApplicationStage; label: string }[] = [
  { stage: "APPLIED", label: "Applied" },
  { stage: "SCREENING", label: "Screening" },
  { stage: "INTERVIEW", label: "Interview" },
  { stage: "OFFER", label: "Offer" },
  { stage: "HIRED", label: "Hired" },
  { stage: "REJECTED", label: "Rejected" },
];

export function listOpenJobs(organizationId: string) {
  return db.jobPosting.findMany({
    where: { organizationId, status: { in: ["OPEN", "ON_HOLD", "DRAFT"] } },
    orderBy: { openedAt: "asc" },
    select: {
      id: true,
      title: true,
      status: true,
      location: true,
      remote: true,
      openedAt: true,
      department: { select: { name: true } },
      _count: { select: { applications: true } },
    },
  });
}

export function listApplications(jobPostingId: string, organizationId: string) {
  return db.application.findMany({
    where: { jobPostingId, organizationId },
    orderBy: [{ fitScore: { sort: "desc", nulls: "last" } }, { boardPosition: "asc" }],
    select: {
      id: true,
      stage: true,
      fitScore: true,
      stageChangedAt: true,
      candidate: { select: { firstName: true, lastName: true, email: true, source: true } },
    },
  });
}
