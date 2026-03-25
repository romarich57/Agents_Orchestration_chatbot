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
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
      aria-live={["pending", "streaming"].includes(message.status) ? "polite" : undefined}
    >
      <div
        className={cn(
          "max-w-3xl rounded-[1.75rem] border px-4 py-4 shadow-sm",
          isUser
            ? "border-transparent bg-[color:var(--accent)] text-white"
            : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)]",
        )}
      >
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] opacity-70">
          <span>{isUser ? "Utilisateur" : "Assistant"}</span>
          <span>•</span>
          <span>{message.status}</span>
        </div>

        {message.content ? (
          isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
          ) : (
            <Markdown content={message.content} />
          )
        ) : isThinking ? (
          <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
            <span className="inline-flex gap-1">
              <span className="size-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
              <span className="size-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
              <span className="size-2 animate-bounce rounded-full bg-current" />
            </span>
            L&apos;agent réfléchit
          </div>
        ) : isEmptyCompleted ? (
          <p className="text-sm text-[color:var(--muted)]">Réponse vide du workflow.</p>
        ) : null}

        {message.error ? (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[color:var(--danger)]/10 px-3 py-2 text-xs text-[color:var(--danger)]">
            <AlertCircle className="size-4" />
            {message.error}
          </div>
        ) : null}
      </div>
    </article>
  );
};
