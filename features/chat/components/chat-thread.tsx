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
    <div className="flex-1 overflow-y-auto bg-[color:var(--surface)]">
      <div className="max-w-3xl mx-auto w-full px-4 py-8 md:px-6 md:py-10 flex flex-col min-h-full">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[color:var(--muted-foreground)]">
            <p className="opacity-70">Envoyez un message pour démarrer la conversation.</p>
          </div>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        <div ref={bottomAnchorRef} className="h-4" />
      </div>
    </div>
  );
};
