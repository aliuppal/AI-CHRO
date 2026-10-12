import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { SessionUser } from "@/lib/session";

import { CommandMenu } from "./command-menu";
import { NotificationsMenu } from "./notifications-menu";
import { UserMenu } from "./user-menu";

export function TopBar({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1 size-9" />
      <Separator orientation="vertical" className="mx-1 data-vertical:h-5 data-vertical:self-center" />
      <CommandMenu />
      <div className="ml-auto flex items-center gap-1">
        <NotificationsMenu />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
