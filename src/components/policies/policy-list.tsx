import Link from "next/link";
import { connection } from "next/server";
import { ScrollText } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { StatusDot } from "@/components/status-dot";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryLabel, COMPLIANCE, excerpt, listPolicies, POLICY_STATUS } from "@/lib/data/policies";
import { formatDate } from "@/lib/format";

export async function PolicyList({ organizationId }: { organizationId: string }) {
  await connection();
  const policies = await listPolicies(organizationId);
  if (policies.length === 0) {
    return (
      <EmptyState icon={ScrollText} title="No policies yet" description="Most teams start with remote work, time off and a code of conduct." />
    );
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {policies.map((p) => (
        <li key={p.id}>
          <Link
            href={"/policies/" + p.id}
            className="flex h-full flex-col rounded-xl border bg-card p-5 transition-colors hover:border-input hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <p className="text-xs text-muted-foreground">
              {categoryLabel(p.category)}
              {p.region ? " · " + p.region : ""} · v{p.version}
            </p>
            <h2 className="mt-1 text-heading-md font-medium">{p.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{excerpt(p.content)}</p>
            <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4">
              <StatusDot tone={POLICY_STATUS[p.status].tone} label={POLICY_STATUS[p.status].label} />
              <StatusDot tone={COMPLIANCE[p.complianceStatus].tone} label={COMPLIANCE[p.complianceStatus].label} />
              <span className="ml-auto text-xs text-muted-foreground">
                {p.publishedAt ? "Published " + formatDate(p.publishedAt) : "Edited " + formatDate(p.updatedAt)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PolicyListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-44 rounded-xl" />
      ))}
    </div>
  );
}
