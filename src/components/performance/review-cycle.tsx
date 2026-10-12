import { connection } from "next/server";
import { TrendingUp } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { StatusDot, type Tone } from "@/components/status-dot";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReviewStatus } from "@/generated/prisma/enums";
import { fullName, listEmployees } from "@/lib/data/people";
import { getCurrentCycle, listReviews } from "@/lib/data/performance";
import { formatDate } from "@/lib/format";

import { StartReviewDialog } from "./start-review-dialog";

const STATUS: Record<ReviewStatus, { tone: Tone; label: string }> = {
  DRAFT: { tone: "neutral", label: "Not started" },
  AI_DRAFTED: { tone: "warning", label: "AI draft ready" },
  IN_REVIEW: { tone: "warning", label: "In review" },
  SUBMITTED: { tone: "info", label: "Submitted" },
  ACKNOWLEDGED: { tone: "positive", label: "Acknowledged" },
};

const ORDER: ReviewStatus[] = ["DRAFT", "AI_DRAFTED", "IN_REVIEW", "SUBMITTED", "ACKNOWLEDGED"];

export async function StartReview({ organizationId }: { organizationId: string }) {
  await connection();
  const [employees, cycle] = await Promise.all([listEmployees(organizationId), getCurrentCycle(organizationId)]);
  const option = (e: (typeof employees)[number]) => ({ value: e.id, label: fullName(e) + " · " + e.jobTitle });
  return (
    <StartReviewDialog
      employees={employees.map(option)}
      reviewers={employees.filter((e) => e.directReports.length > 0).map(option)}
      cycleName={cycle ?? "H2 2026"}
    />
  );
}

export async function ReviewCycle({ organizationId }: { organizationId: string }) {
  await connection();
  const cycle = await getCurrentCycle(organizationId);
  if (!cycle) {
    return <EmptyState icon={TrendingUp} title="No review cycle running" description="Start a review to open your first cycle." />;
  }
  const reviews = await listReviews(organizationId, cycle);
  const done = reviews.filter((r) => r.status === "SUBMITTED" || r.status === "ACKNOWLEDGED").length;
  const counts = ORDER.map((s) => ({ s, n: reviews.filter((r) => r.status === s).length })).filter((c) => c.n > 0);
  const pct = reviews.length ? (done / reviews.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="cycle-title" className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="cycle-title" className="text-heading-md font-medium">
            {cycle} review cycle
          </h2>
          <p className="text-sm text-muted-foreground">
            {done} of {reviews.length} submitted
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Reviews submitted"
          aria-valuemin={0}
          aria-valuemax={reviews.length}
          aria-valuenow={done}
          className="mt-4 h-2 overflow-hidden rounded-full bg-accent"
        >
          <div className="h-full rounded-full bg-foreground" style={{ width: pct + "%" }} />
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {counts.map(({ s, n }) => (
            <li key={s} className="flex items-center gap-2 text-sm">
              <StatusDot tone={STATUS[s].tone} label={STATUS[s].label} />
              <span className="font-medium tabular-nums">{n}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Employee</TableHead>
              <TableHead className="hidden md:table-cell">Department</TableHead>
              <TableHead className="hidden sm:table-cell">Reviewer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Rating</TableHead>
              <TableHead className="pr-4">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="pl-4">
                  <div className="font-medium">{fullName(r.employee)}</div>
                  <div className="text-xs text-muted-foreground">{r.employee.jobTitle}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{r.employee.department?.name ?? "—"}</TableCell>
                <TableCell className="hidden sm:table-cell">{r.reviewer ? fullName(r.reviewer) : "—"}</TableCell>
                <TableCell>
                  <StatusDot tone={STATUS[r.status].tone} label={STATUS[r.status].label} />
                </TableCell>
                <TableCell className="hidden tabular-nums lg:table-cell">{r.rating ? r.rating + " / 5" : "—"}</TableCell>
                <TableCell className="pr-4 tabular-nums">{formatDate(r.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function ReviewCycleSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
