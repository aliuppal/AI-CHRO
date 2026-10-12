"use server";

import { revalidatePath } from "next/cache";

import type { Rating } from "@/generated/prisma/enums";
import { failureMessage, regenerateDailyBriefing } from "@/lib/briefing";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const today = () => new Date().toISOString().slice(0, 10);

export async function regenerateBriefing(): Promise<{ ok: boolean; message: string }> {
  const user = getCurrentUser();
  const result = await regenerateDailyBriefing(user.organizationId, today());
  revalidatePath("/dashboard");
  return result.status === "ready"
    ? { ok: true, message: "Briefing updated." }
    : { ok: false, message: failureMessage(result.reason) + " The current briefing was kept." };
}

export async function rateBriefing(day: string, rating: Rating) {
  const user = getCurrentUser();
  const targetId = user.organizationId + ":" + day;
  await db.aiFeedback.upsert({
    where: { userId_targetType_targetId: { userId: user.id, targetType: "DAILY_BRIEFING", targetId } },
    create: { organizationId: user.organizationId, userId: user.id, targetType: "DAILY_BRIEFING", targetId, rating },
    update: { rating },
  });
}
