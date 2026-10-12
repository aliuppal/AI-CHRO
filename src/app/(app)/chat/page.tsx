import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { generateId } from "ai";

import { ChatView } from "@/components/chat/chat-view";

export const metadata: Metadata = { title: "Ask CHRO" };

async function NewChat({ searchParams }: { searchParams: PageProps<"/chat">["searchParams"] }) {
  const params = await searchParams;
  await connection(); // the chat id is random, so this must run per request
  const q = typeof params.q === "string" ? params.q.slice(0, 4000) : "";
  const autoSend = params.send === "1" && q.trim().length > 0;
  const id = generateId();
  return <ChatView key={id} id={id} initialMessages={[]} initialInput={q} autoSend={autoSend} isNew />;
}

export default function NewChatPage({ searchParams }: PageProps<"/chat">) {
  return (
    <Suspense fallback={null}>
      <NewChat searchParams={searchParams} />
    </Suspense>
  );
}
