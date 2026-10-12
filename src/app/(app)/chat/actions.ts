"use server";

import type { Rating } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function rateMessage(messageId: string, rating: Rating) {
  const user = getCurrentUser();
  const message = await db.chatMessage.findFirst({
    where: { id: messageId, role: "ASSISTANT", conversation: { userId: user.id } },
    select: { id: true },
  });
  if (!message) return { ok: false as const };

  await db.aiFeedback.upsert({
    where: { userId_targetType_targetId: { userId: user.id, targetType: "CHAT_MESSAGE", targetId: messageId } },
    create: { organizationId: user.organizationId, userId: user.id, targetType: "CHAT_MESSAGE", targetId: messageId, rating },
    update: { rating },
  });
  return { ok: true as const };
}
