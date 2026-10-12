"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { PriorityBadge } from "@/components/priority-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sampleNotifications } from "@/lib/mock/notifications";

export function NotificationsMenu() {
  const notifications = sampleNotifications;
  const urgent = notifications.filter((n) => n.priority === "high").length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="relative"
          aria-label={urgent ? `Notifications, ${urgent} high priority` : "Notifications"}
        >
          <Bell />
          {urgent > 0 && (
            <span
              aria-hidden
              className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-risk-high px-1 text-[10px] leading-4 font-medium text-white"
            >
              {urgent}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium text-foreground">Notifications</span>
          <Badge variant="outline" className="font-normal text-muted-foreground">
            Sample data
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-96 overflow-y-auto p-1">
          {notifications.map((n) => (
            <DropdownMenuItem key={n.id} asChild className="items-start gap-3 px-3 py-2.5">
              <Link href={n.href}>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <PriorityBadge priority={n.priority} />
                    <span className="text-xs text-muted-foreground">{n.age}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{n.title}</span>
                  <span className="text-xs text-muted-foreground">{n.detail}</span>
                </div>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
