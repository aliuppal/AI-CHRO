import Link from "next/link";
import { connection } from "next/server";
import { SquareKanban } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { listDepartments } from "@/lib/data/people";
import { listApplications, listOpenJobs, STAGES } from "@/lib/data/talent";
import { daysSince } from "@/lib/format";
import { cn } from "@/lib/utils";

import { MoveMenu } from "./move-menu";
import { AddCandidateDialog, NewJobDialog } from "./talent-dialogs";

export async function TalentActions({ organizationId, jobId }: { organizationId: string; jobId?: string }) {
  await connection();
  const [departments, jobs] = await Promise.all([listDepartments(organizationId), listOpenJobs(organizationId)]);
  return (
    <>
      <NewJobDialog departments={departments.map((d) => ({ value: d.id, label: d.name }))} />
      {jobs.length > 0 && (
        <AddCandidateDialog jobs={jobs.map((j) => ({ value: j.id, label: j.title }))} defaultJobId={jobId ?? jobs[0].id} />
      )}
    </>
  );
}

function FitMeter({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground">Not scored</span>;
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground">
      <span aria-hidden className="h-1.5 w-12 overflow-hidden rounded-full bg-accent">
        <span className="block h-full rounded-full bg-foreground" style={{ width: score + "%" }} />
      </span>
      <span className="tabular-nums">{score}% fit</span>
    </span>
  );
}

export async function PipelineBoard({ organizationId, jobId }: { organizationId: string; jobId?: string }) {
  await connection();
  const jobs = await listOpenJobs(organizationId);
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={SquareKanban}
        title="No open roles yet"
        description="Open a role with New role. Applicants then land here, ranked by fit."
      />
    );
  }
  const job = jobs.find((j) => j.id === jobId) ?? jobs[0];
  const applications = await listApplications(job.id, organizationId);

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Open roles" className="flex flex-wrap gap-2">
        {jobs.map((j) => {
          const active = j.id === job.id;
          return (
            <Link
              key={j.id}
              href={"/talent?job=" + j.id}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted",
                active && "border-foreground bg-foreground text-background hover:bg-foreground",
              )}
            >
              {j.title} <span className={cn("text-muted-foreground", active && "text-background/70")}>{j._count.applications}</span>
            </Link>
          );
        })}
      </nav>

      <p className="text-sm text-muted-foreground">
        {[job.department?.name, job.location, job.remote ? "Remote OK" : null, job.openedAt ? "open " + daysSince(job.openedAt) + " days" : null]
          .filter(Boolean)
          .join(" · ")}
      </p>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8">
        <div className="grid min-w-[1100px] grid-cols-6 gap-3">
          {STAGES.map(({ stage, label }) => {
            const cards = applications.filter((a) => a.stage === stage);
            return (
              <section key={stage} aria-labelledby={"col-" + stage} className="flex flex-col rounded-xl bg-muted p-2">
                <h2 id={"col-" + stage} className="flex items-center justify-between px-2 py-1.5 text-sm font-medium">
                  {label}
                  <span className="text-muted-foreground tabular-nums">{cards.length}</span>
                </h2>
                <ul className="flex flex-col gap-2">
                  {cards.map((a) => {
                    const name = a.candidate.firstName + " " + a.candidate.lastName;
                    return (
                      <li key={a.id} className="rounded-lg border bg-card p-3">
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-sm font-medium">{name}</span>
                          <MoveMenu applicationId={a.id} candidateName={name} current={a.stage} stages={STAGES} />
                        </div>
                        <div className="mt-2">
                          <FitMeter score={a.fitScore} />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {[a.candidate.source, daysSince(a.stageChangedAt) + "d in stage"].filter(Boolean).join(" · ")}
                        </p>
                      </li>
                    );
                  })}
                  {cards.length === 0 && <li className="px-2 py-4 text-center text-xs text-muted-foreground">No one here</li>}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="flex gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-7 w-44 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
