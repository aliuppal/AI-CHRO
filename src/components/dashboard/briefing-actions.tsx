"use client";

import { useState, useTransition } from "react";
import { RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";

import { rateBriefing, regenerateBriefing } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import type { Rating } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export function BriefingActions({ day, initialRating }: { day: string; initialRating: Rating | null }) {
  const [rating, setRating] = useState<Rating | null>(initialRating);
  const [regenerating, startRegenerate] = useTransition();
  const [, startRating] = useTransition();

  function rate(value: Rating) {
    setRating(value);
    startRating(() => rateBriefing(day, value));
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label="This briefing was helpful"
        aria-pressed={rating === "UP"}
        onClick={() => rate("UP")}
      >
        <ThumbsUp className={cn(rating === "UP" && "fill-current")} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="This briefing was not helpful"
        aria-pressed={rating === "DOWN"}
        onClick={() => rate("DOWN")}
      >
        <ThumbsDown className={cn(rating === "DOWN" && "fill-current")} />
      </Button>
      <span role="status" className="sr-only">
        {rating ? "Thanks for the feedback." : ""}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="ml-1"
        disabled={regenerating}
        onClick={() => startRegenerate(() => regenerateBriefing())}
      >
        <RefreshCw className={cn(regenerating && "animate-spin motion-reduce:animate-none")} />
        {regenerating ? "Drafting…" : "Regenerate"}
      </Button>
    </div>
  );
}
