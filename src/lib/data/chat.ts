import "server-only";
import type { UIMessage } from "ai";

import type { ChatRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export const CHAT_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

const toRole: Record<UIMessage["role"], ChatRole> = { system: "SYSTEM", user: "USER", assistant: "ASSISTANT" };
const fromRole: Record<ChatRole, UIMessage["role"]> = {
  SYSTEM: "system",
  USER: "user",
  ASSISTANT: "assistant",
  TOOL: "assistant",
};

export function textOf(message: Pick<UIMessage, "parts">) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

/** The conversation, if it exists and belongs to this user. */
export function findConversation(id: string, userId: string) {
  return db.chatConversation.findFirst({ where: { id, userId } });
}

export async function loadMessages(conversationId: string): Promise<UIMessage[]> {
  const rows = await db.chatMessage.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    role: fromRole[row.role],
    parts: (row.parts as UIMessage["parts"] | null) ?? [{ type: "text", text: row.content }],
  }));
}

export function listConversations(userId: string) {
  return db.chatConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: { id: true, title: true, updatedAt: true },
  });
}

/**
 * Persist the conversation after a reply. Inserts new messages and removes ones
 * that were replaced (a regenerated answer), so existing timestamps stay intact.
 */
export async function saveMessages(conversationId: string, messages: UIMessage[], model: string) {
  const existing = await db.chatMessage.findMany({ where: { conversationId }, select: { id: true } });
  const existingIds = new Set(existing.map((m) => m.id));
  const keepIds = messages.map((m) => m.id);
  const now = Date.now();

  await db.$transaction([
    db.chatMessage.deleteMany({ where: { conversationId, id: { notIn: keepIds } } }),
    db.chatMessage.createMany({
      data: messages
        .filter((m) => !existingIds.has(m.id))
        .map((m, i) => ({
          id: m.id,
          conversationId,
          role: toRole[m.role],
          content: textOf(m),
          parts: m.parts.filter((p) => p.type === "text") as object[],
          model: m.role === "assistant" ? model : null,
          createdAt: new Date(now + i),
        })),
    }),
    db.chatConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
  ]);
}
