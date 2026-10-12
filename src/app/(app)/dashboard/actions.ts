"use server";

import { updateTag } from "next/cache";

import type { Rating } from "@/generated/prisma/enums";
import { briefingTag } from "@/lib/briefing";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function regenerateBriefing() {
  const user = getCurrentUser();
  updateTag(briefingTag(user.organizationId));
}

export async function rateBriefing(day: string, rating: Rating) {
  const user = getCurrentUser();
  const targetId = `${user.organizationId}:${day}`;
  await db.aiFeedback.upsert({
    where: { userId_targetType_targetId: { userId: user.id, targetType: "DAILY_BRIEFING", targetId } },
    create: { organizationId: user.organizationId, userId: user.id, targetType: "DAILY_BRIEFING", targetId, rating },
    update: { rating },
  });
}
