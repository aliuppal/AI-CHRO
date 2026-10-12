import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChatView } from "@/components/chat/chat-view";
import { CHAT_ID_PATTERN, findConversation, loadMessages } from "@/lib/data/chat";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Ask CHRO" };

async function Conversation({ params }: { params: PageProps<"/chat/[id]">["params"] }) {
  const { id } = await params;
  if (!CHAT_ID_PATTERN.test(id)) notFound();
  const conversation = await findConversation(id, getCurrentUser().id);
  if (!conversation) notFound();
  const messages = await loadMessages(id);
  return <ChatView key={id} id={id} initialMessages={messages} />;
}

export default function ConversationPage({ params }: PageProps<"/chat/[id]">) {
  return (
    <Suspense fallback={null}>
      <Conversation params={params} />
    </Suspense>
  );
}
