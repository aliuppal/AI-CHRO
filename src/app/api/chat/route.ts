import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  validateUIMessages,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { chatModel, MODEL_ID } from "@/lib/ai";
import { chroSystemPrompt } from "@/lib/chro-persona";
import { CHAT_ID_PATTERN, findConversation, loadMessages, saveMessages, textOf } from "@/lib/data/chat";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const maxDuration = 60;

const bodySchema = z.object({
  id: z.string().regex(CHAT_ID_PATTERN),
  trigger: z.enum(["submit-message", "regenerate-message"]),
  messageId: z.string().optional(),
  message: z.unknown().optional(),
});

export async function POST(req: Request) {
  const user = getCurrentUser();
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { id, trigger, messageId, message } = parsed.data;

  // History always comes from the database, never from the client.
  const conversation = await findConversation(id, user.id);
  if (!conversation && (await db.chatConversation.findUnique({ where: { id }, select: { id: true } }))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const history = conversation ? await loadMessages(id) : [];

  let messages: UIMessage[];
  if (trigger === "submit-message") {
    const [incoming] = await validateUIMessages({ messages: [message] });
    if (incoming.role !== "user" || !textOf(incoming)) {
      return Response.json({ error: "Expected a user message" }, { status: 400 });
    }
    messages = [...history.filter((m) => m.id !== incoming.id), incoming];
  } else {
    // Regenerate: drop the assistant message being replaced, and anything after it.
    const index = messageId ? history.findIndex((m) => m.id === messageId) : -1;
    messages =
      index >= 0
        ? history.slice(0, index)
        : history.at(-1)?.role === "assistant"
          ? history.slice(0, -1)
          : history;
  }
  if (messages.length === 0 || messages.at(-1)?.role !== "user") {
    return Response.json({ error: "Nothing to answer" }, { status: 400 });
  }

  if (!conversation) {
    const first = textOf(messages[0]);
    await db.chatConversation.create({
      data: {
        id,
        organizationId: user.organizationId,
        userId: user.id,
        title: first.length > 60 ? first.slice(0, 57).trimEnd() + "…" : first,
      },
    });
  }

  const org = await db.organization.findUniqueOrThrow({ where: { id: user.organizationId } });

  const result = streamText({
    model: chatModel,
    system: chroSystemPrompt(org, new Date()),
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 3000,
    maxRetries: 1,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      sendReasoning: false,
      generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
      onError: (error) => {
        console.error("Ask CHRO stream failed", error);
        return "The free AI model is busy or rate-limited right now. Please try again in a moment.";
      },
      onEnd: async ({ messages: finalMessages }) => {
        await saveMessages(id, finalMessages, MODEL_ID);
      },
    }),
  });
}
