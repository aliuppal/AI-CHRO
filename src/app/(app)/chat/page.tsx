import type { Metadata } from "next";
import { MessageSquareText } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Ask CHRO" };

export default function ChatPage() {
  return (
    <>
      <PageHeader
        title="Ask CHRO"
        description="Ask anything about people operations. Answers flag where you need an employment lawyer."
      />
      <EmptyState
        icon={MessageSquareText}
        title="No conversations yet"
        description="Try: How do I run a fair performance improvement plan?"
      />
    </>
  );
}
