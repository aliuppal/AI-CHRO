import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Sparkles } from "lucide-react";

import { PriorityBadge } from "@/components/priority-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { failureMessage, getDailyBriefing } from "@/lib/briefing";
import { getOpenAlerts } from "@/lib/data/alerts";
import { db } from "@/lib/db";

import { BriefingActions } from "./briefing-actions";

function BriefingHeader({ dateLabel }: { dateLabel?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Sparkles className="size-4" strokeWidth={1.75} aria-hidden />
      <h2 id="briefing-title" className="text-heading-md font-medium">
        Daily briefing
      </h2>
      {dateLabel && <span className="text-sm text-muted-foreground">· {dateLabel}</span>}
    </div>
  );
}

const dateLabelOf = (d: Date) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

export async function DailyBriefing({ organizationId, userId }: { organizationId: string; userId: string }) {
  await connection();
  const now = new Date();
  const day = now.toISOString().slice(0, 10);

  const [alerts, briefing, feedback] = await Promise.all([
    getOpenAlerts(organizationId),
    getDailyBriefing(organizationId, day).catch((error: unknown) => {
      // Database or unexpected errors: still show the alerts below.
      console.error("Daily briefing failed", error);
      return { status: "failed", reason: "unavailable" } as const;
    }),
    db.aiFeedback.findUnique({
      where: {
        userId_targetType_targetId: { userId, targetType: "DAILY_BRIEFING", targetId: organizationId + ":" + day },
      },
      select: { rating: true },
    }),
  ]);

  return (
    <section aria-labelledby="briefing-title" className="flex flex-col rounded-xl border bg-card">
      <div className="flex flex-col gap-4 p-6">
        <BriefingHeader dateLabel={dateLabelOf(now)} />
        {briefing.status === "ready" ? (
          <p className="text-[17px] leading-relaxed text-pretty">{briefing.summary}</p>
        ) : (
          <p className="text-muted-foreground">{failureMessage(briefing.reason)} Your open alerts are below.</p>
        )}
      </div>

      <div className="border-t px-6 py-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Needs you today</h3>
        {alerts.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Nothing urgent. Enjoy the quiet.</p>
        ) : (
          <ul className="-mx-2 flex flex-col">
            {alerts.slice(0, 5).map((alert) => (
              <li key={alert.id}>
                <Link
                  href={alert.href}
                  className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <PriorityBadge priority={alert.priority} className="mt-0.5 w-16 shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium">{alert.title}</span>
                    <span className="text-sm text-muted-foreground">{alert.reason}</span>
                    {alert.nextAction && (
                      <span className="text-xs text-muted-foreground">Next step: {alert.nextAction}</span>
                    )}
                  </span>
                  <ArrowRight
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t px-6 py-3">
        <p className="text-xs text-muted-foreground">
          Drafted by AI from your HR data{briefing.status === "ready" ? " · " + briefing.model.replace(/:free$/, "") : ""}. Check before
          acting.
        </p>
        <BriefingActions day={day} initialRating={feedback?.rating ?? null} />
      </div>
    </section>
  );
}

export function DailyBriefingSkeleton() {
  return (
    <section className="flex flex-col rounded-xl border bg-card">
      <div className="flex flex-col gap-4 p-6">
        <BriefingHeader />
        <p role="status" className="text-sm text-muted-foreground">
          Drafting today&apos;s briefing…
        </p>
        <div className="flex flex-col gap-2" aria-hidden>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t px-6 py-5" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-4 w-14" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
