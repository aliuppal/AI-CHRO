import { Suspense } from "react";
import { connection } from "next/server";

import { ChatHistory } from "@/components/chat/chat-history";
import { Skeleton } from "@/components/ui/skeleton";
import { listConversations } from "@/lib/data/chat";
import { getCurrentUser } from "@/lib/session";

async function History({ userId }: { userId: string }) {
  await connection();
  const conversations = await listConversations(userId);
  return <ChatHistory conversations={conversations.map((c) => ({ id: c.id, title: c.title ?? "Untitled" }))} />;
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3" aria-hidden>
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-7 w-full" />
      ))}
    </div>
  );
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  return (
    <div className="-mx-4 -my-8 flex h-[calc(100dvh-3.5rem)] md:-mx-8">
      <h1 className="sr-only">Ask CHRO</h1>
      <aside className="hidden w-64 shrink-0 flex-col border-r lg:flex">
        <Suspense fallback={<HistorySkeleton />}>
          <History userId={user.id} />
        </Suspense>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
