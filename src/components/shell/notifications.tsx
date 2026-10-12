import { connection } from "next/server";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getOpenAlerts, relativeAge } from "@/lib/data/alerts";

import { NotificationsMenu } from "./notifications-menu";

export async function Notifications({ organizationId }: { organizationId: string }) {
  await connection();
  const alerts = await getOpenAlerts(organizationId);
  return (
    <NotificationsMenu
      notifications={alerts.map((a) => ({
        id: a.id,
        title: a.title,
        detail: a.reason,
        priority: a.priority,
        href: a.href,
        age: relativeAge(a.createdAt),
      }))}
    />
  );
}

/** Same footprint as the real bell, so the top bar doesn't shift while alerts load. */
export function NotificationsFallback() {
  return (
    <Button variant="ghost" size="icon-lg" aria-label="Notifications, loading" disabled>
      <Bell />
    </Button>
  );
}
