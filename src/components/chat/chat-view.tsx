"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUp, Check, Copy, RefreshCw, Square, ThumbsDown, ThumbsUp } from "lucide-react";

import { rateMessage } from "@/app/(app)/chat/actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Rating } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

import { Markdown } from "./markdown";

// The server rebuilds history from the database, so send only what changed.
const transport = new DefaultChatTransport<UIMessage>({
  api: "/api/chat",
  prepareSendMessagesRequest: ({ id, messages, trigger, messageId }) => ({
    body: { id, trigger, messageId, message: trigger === "submit-message" ? messages.at(-1) : undefined },
  }),
});

const SUGGESTIONS = [
  "Draft a severance agreement for a contractor in California",
  "How do I run a fair performance improvement plan?",
  "Customer Success is showing burnout signals. What should I do this week?",
  "Write a remote work policy for a 100-person company",
];

const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

export function ChatView({
  id,
  initialMessages,
  initialInput = "",
  autoSend = false,
  isNew = false,
}: {
  id: string;
  initialMessages: UIMessage[];
  initialInput?: string;
  autoSend?: boolean;
  isNew?: boolean;
}) {
  const [input, setInput] = useState(autoSend ? "" : initialInput);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSent = useRef(false);

  const { messages, sendMessage, regenerate, stop, status, error, clearError } = useChat({
    id,
    messages: initialMessages,
    transport,
    onFinish: ({ message }) => {
      // First reply in a new chat: give it a real URL and tell the history list.
      if (isNew && window.location.pathname === "/chat") {
        window.history.replaceState(null, "", "/chat/" + id);
        const first = messages[0] ?? message;
        window.dispatchEvent(
          new CustomEvent("chat:created", { detail: { id, title: textOf(first).slice(0, 60) || "New chat" } }),
        );
      }
    },
  });

  const busy = status === "submitted" || status === "streaming";

  // Deferred one tick so a StrictMode mount/unmount cycle cancels the first
  // attempt instead of aborting a request that is already in flight.
  useEffect(() => {
    if (!autoSend || !initialInput.trim() || autoSent.current) return;
    const timer = setTimeout(() => {
      autoSent.current = true;
      sendMessage({ text: initialInput.trim() });
    }, 0);
    return () => clearTimeout(timer);
  }, [autoSend, initialInput, sendMessage]);

  // Keep the newest message in view while it streams.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [messages, status]);

  function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    if (error) clearError();
    sendMessage({ text: value });
    setInput("");
  }

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
        <div
          role="log"
          aria-busy={busy}
          aria-label="Conversation"
          className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8"
        >
          {messages.length === 0 && !busy ? (
            <Welcome onPick={send} />
          ) : (
            messages.map((m) =>
              m.role === "user" ? (
                <UserMessage key={m.id} text={textOf(m)} />
              ) : (
                <AssistantMessage
                  key={m.id}
                  id={m.id}
                  text={textOf(m)}
                  streaming={status === "streaming" && m.id === lastAssistantId}
                  canRegenerate={!busy && m.id === lastAssistantId}
                  onRegenerate={() => regenerate({ messageId: m.id })}
                />
              ),
            )
          )}

          {status === "submitted" && <Thinking />}

          {error && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted px-4 py-3 text-sm">
              <span>{error.message || "Something went wrong."}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearError();
                  regenerate();
                }}
              >
                <RefreshCw />
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>

      <Composer value={input} onChange={setInput} onSubmit={() => send(input)} onStop={stop} busy={busy} autoFocus={!!initialInput && !autoSend} />
    </div>
  );
}

function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center pt-8 text-center sm:pt-16">
      <span aria-hidden className="mb-5 flex size-11 items-center justify-center rounded-lg bg-night">
        <span className="size-3 rounded-full bg-primary" />
      </span>
      <h2 className="text-display-md font-medium">What can I help with?</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        Ask about hiring, performance, policies or a tricky people situation. Answers point out when you need an
        employment lawyer.
      </p>
      <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-xl border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function AssistantMessage({
  id,
  text,
  streaming,
  canRegenerate,
  onRegenerate,
}: {
  id: string;
  text: string;
  streaming: boolean;
  canRegenerate: boolean;
  onRegenerate: () => void;
}) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [copied, setCopied] = useState(false);

  async function rate(value: Rating) {
    setRating(value);
    await rateMessage(id, value);
  }

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex gap-3">
      <span aria-hidden className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-md bg-night">
        <span className="size-2 rounded-full bg-primary" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="sr-only">TalentMind said:</span>
        <Markdown>{text}</Markdown>
        {!streaming && text && (
          <div className="mt-2 -ml-2 flex items-center gap-0.5 text-muted-foreground">
            <Button variant="ghost" size="icon-sm" aria-label={copied ? "Copied" : "Copy answer"} onClick={copy}>
              {copied ? <Check /> : <Copy />}
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Helpful" aria-pressed={rating === "UP"} onClick={() => rate("UP")}>
              <ThumbsUp className={cn(rating === "UP" && "fill-current")} />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Not helpful" aria-pressed={rating === "DOWN"} onClick={() => rate("DOWN")}>
              <ThumbsDown className={cn(rating === "DOWN" && "fill-current")} />
            </Button>
            {canRegenerate && (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onRegenerate}>
                <RefreshCw />
                Regenerate
              </Button>
            )}
            <span role="status" className="sr-only">
              {rating ? "Thanks for the feedback." : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex gap-3">
      <span aria-hidden className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-md bg-night">
        <span className="size-2 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
      </span>
      <div className="flex flex-1 flex-col gap-2 pt-1.5">
        <p role="status" className="text-sm text-muted-foreground">
          Thinking it through…
        </p>
        <Skeleton className="h-4 w-11/12" aria-hidden />
        <Skeleton className="h-4 w-3/4" aria-hidden />
      </div>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  busy: boolean;
  autoFocus: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="border-t bg-background px-4 pt-3 pb-4"
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-xl border border-input bg-background p-2 focus-within:outline-2 focus-within:outline-ring">
          <label htmlFor="chat-input" className="sr-only">
            Message Ask CHRO
          </label>
          <textarea
            id="chat-input"
            rows={1}
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="Ask about people, policies or a tricky situation…"
            className="field-sizing-content max-h-48 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] outline-none placeholder:text-muted-foreground"
          />
          {busy ? (
            <Button type="button" variant="outline" size="icon-lg" aria-label="Stop generating" onClick={onStop}>
              <Square className="fill-current" />
            </Button>
          ) : (
            <Button type="submit" size="icon-lg" aria-label="Send message" disabled={!value.trim()}>
              <ArrowUp />
            </Button>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          TalentMind can make mistakes and is not a lawyer. Check important decisions with employment counsel.
        </p>
      </div>
    </form>
  );
}
