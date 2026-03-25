"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "@/features/chat/components/message-bubble";
import type { MessageDto } from "@/features/chat/types/chat";

export const ChatThread = ({ messages }: { messages: MessageDto[] }) => {
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6 md:px-8">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-[color:var(--muted)]">
          Aucun message dans cette conversation pour l’instant.
        </div>
      ) : (
        messages.map((message) => <MessageBubble key={message.id} message={message} />)
      )}
      <div ref={bottomAnchorRef} />
    </div>
  );
};
