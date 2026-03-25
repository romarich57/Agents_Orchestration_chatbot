"use client";

import { AlertCircle } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils/cn";
import type { MessageDto } from "@/features/chat/types/chat";

export const MessageBubble = ({ message }: { message: MessageDto }) => {
  const isUser = message.role === "user";
  const isThinking =
    !isUser && !message.content && ["pending", "streaming"].includes(message.status);
  const isEmptyCompleted = !isUser && !message.content && message.status === "completed";

  return (
    <article
      className={cn("flex w-full mb-6", isUser ? "justify-end" : "justify-start")}
      aria-live={["pending", "streaming"].includes(message.status) ? "polite" : undefined}
    >
      <div
        className={cn(
          "max-w-3xl flex flex-col gap-2",
          isUser ? "items-end" : "items-start w-full"
        )}
      >
        <div className="flex items-center gap-2 px-1 text-[0.65rem] font-medium uppercase tracking-widest text-[color:var(--muted-foreground)]">
          <span>{isUser ? "Vous" : "Assistant"}</span>
        </div>

        <div
          className={cn(
            "relative px-5 py-4",
            isUser
              ? "rounded-2xl rounded-tr-sm border border-[color:var(--border)] bg-[color:var(--user-bubble)] text-[color:var(--foreground)] shadow-[var(--shadow-sm)]"
              : "w-full text-[color:var(--foreground)]"
          )}
        >
          {message.content ? (
            isUser ? (
              <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed">{message.content}</p>
            ) : (
              <Markdown content={message.content} />
            )
          ) : isThinking ? (
            <div className="flex items-center gap-2 h-6 text-sm text-[color:var(--muted)] font-medium">
              <span className="inline-flex gap-1">
                <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-current" />
              </span>
              <span className="opacity-70 text-xs">Analyse en cours...</span>
            </div>
          ) : isEmptyCompleted ? (
            <p className="text-sm text-[color:var(--muted)] italic">Réponse vide.</p>
          ) : null}

          {message.error ? (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-[color:var(--danger)] bg-[color:var(--danger-foreground)] px-4 py-3 text-sm text-[color:var(--danger)]">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <p className="leading-snug">{message.error}</p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};
