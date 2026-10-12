"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";

import { moveApplication } from "@/app/(app)/talent/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ApplicationStage } from "@/generated/prisma/enums";

export function MoveMenu({
  applicationId,
  candidateName,
  current,
  stages,
}: {
  applicationId: string;
  candidateName: string;
  current: ApplicationStage;
  stages: { stage: ApplicationStage; label: string }[];
}) {
  const [pending, startTransition] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="xs" disabled={pending} aria-label={"Move " + candidateName + " to another stage"}>
          {pending ? "Moving…" : "Move"}
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Move to</DropdownMenuLabel>
        {stages
          .filter((s) => s.stage !== current)
          .map((s) => (
            <DropdownMenuItem key={s.stage} onSelect={() => startTransition(() => moveApplication(applicationId, s.stage))}>
              {s.label}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
