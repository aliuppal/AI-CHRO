import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Command center"
        description="Headcount, retention risk, hiring speed and engagement, with a daily AI briefing on what needs you today."
      />
      <EmptyState
        icon={LayoutDashboard}
        title="No people data yet"
        description="Add your team and open roles, and your daily briefing and metrics will appear here."
        action={{ label: "Add employees", href: "/employees" }}
      />
    </>
  );
}
