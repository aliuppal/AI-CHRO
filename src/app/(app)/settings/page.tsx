import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Company profile, locations and team roles." />
      <EmptyState
        icon={Settings}
        title="Workspace settings"
        description="Company name, headquarters and work locations will live here. Locations drive which labour laws policies are checked against."
      />
    </>
  );
}
