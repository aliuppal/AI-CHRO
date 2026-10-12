import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TriangleAlert } from "lucide-react";

import { Markdown } from "@/components/chat/markdown";
import { StatusDot } from "@/components/status-dot";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryLabel, COMPLIANCE, getPolicy, POLICY_STATUS } from "@/lib/data/policies";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Policy" };

type Finding = { severity?: string; clause?: string; issue?: string; suggestion?: string };

async function PolicyDetail({ params }: { params: PageProps<"/policies/[id]">["params"] }) {
  const { id } = await params;
  const policy = await getPolicy(id, getCurrentUser().organizationId);
  if (!policy) notFound();
  const findings = Array.isArray(policy.complianceReport) ? (policy.complianceReport as Finding[]) : [];

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {categoryLabel(policy.category)}
          {policy.region ? " · " + policy.region : ""} · Version {policy.version}
          {policy.author?.name ? " · " + policy.author.name : ""}
        </p>
        <h1 className="text-display-md">{policy.title}</h1>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <StatusDot tone={POLICY_STATUS[policy.status].tone} label={POLICY_STATUS[policy.status].label} />
          <StatusDot tone={COMPLIANCE[policy.complianceStatus].tone} label={"Compliance: " + COMPLIANCE[policy.complianceStatus].label} />
          <span className="text-sm text-muted-foreground">
            {policy.publishedAt ? "Published " + formatDate(policy.publishedAt) : "Last edited " + formatDate(policy.updatedAt)}
          </span>
        </div>
      </header>

      {findings.length > 0 && (
        <section aria-labelledby="findings" className="rounded-xl border bg-risk-medium-soft p-5">
          <h2 id="findings" className="flex items-center gap-2 font-medium">
            <TriangleAlert className="size-4" aria-hidden />
            Compliance notes
          </h2>
          <ul className="mt-3 flex flex-col gap-3 text-sm">
            {findings.map((f, i) => (
              <li key={i}>
                <span className="font-medium">{f.clause ?? "General"}:</span> {f.issue}
                {f.suggestion && <span className="block text-muted-foreground">Suggested: {f.suggestion}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="rounded-xl border bg-card p-6 md:p-8">
        {/* The page already shows the title as its h1, so drop a leading "# Title" line. */}
        <Markdown>{policy.content.replace(/^\s*# .*\n+/, "")}</Markdown>
      </div>
      <p className="text-xs text-muted-foreground">
        Sample policies are a starting point, not legal advice. Have employment counsel review before publishing.
      </p>
    </article>
  );
}

export default function PolicyPage({ params }: PageProps<"/policies/[id]">) {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/policies" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        All policies
      </Link>
      <Suspense
        fallback={
          <div className="flex flex-col gap-4" aria-hidden>
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        }
      >
        <PolicyDetail params={params} />
      </Suspense>
    </div>
  );
}
