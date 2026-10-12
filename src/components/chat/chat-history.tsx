"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Conversation = { id: string; title: string };

export function ChatHistory({ conversations: initial }: { conversations: Conversation[] }) {
  const pathname = usePathname();
  const [conversations, setConversations] = useState(initial);

  // A brand-new chat announces itself after its first reply.
  useEffect(() => {
    function onCreated(event: Event) {
      const detail = (event as CustomEvent<Conversation>).detail;
      setConversations((list) => [detail, ...list.filter((c) => c.id !== detail.id)]);
    }
    window.addEventListener("chat:created", onCreated);
    return () => window.removeEventListener("chat:created", onCreated);
  }, []);

  return (
    <nav aria-label="Conversations" className="flex min-h-0 flex-1 flex-col">
      <div className="p-3">
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/chat">
            <Plus />
            New chat
          </Link>
        </Button>
      </div>
      <p className="px-4 pt-2 pb-1 text-xs font-medium text-muted-foreground">Recent</p>
      {conversations.length === 0 ? (
        <p className="px-4 py-2 text-sm text-muted-foreground">Your conversations will appear here.</p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {conversations.map((c) => {
            const active = pathname === "/chat/" + c.id;
            return (
              <li key={c.id}>
                <Link
                  href={"/chat/" + c.id}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block truncate rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
                    active && "bg-accent font-medium",
                  )}
                >
                  {c.title}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
