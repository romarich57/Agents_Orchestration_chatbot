"use client";

import type { ReactNode } from "react";
import { ConversationSidebar } from "@/features/conversations/components/conversation-sidebar";
import { ChatHeader } from "@/features/chat/components/chat-header";
import type { ConversationSummaryDto } from "@/features/conversations/types/conversation";

export const ChatShell = ({
  initialConversations,
  children,
}: {
  initialConversations: ConversationSummaryDto[];
  children: ReactNode;
}) => (
  <div className="app-shell flex min-h-screen bg-[color:var(--background)]">
    <ConversationSidebar initialConversations={initialConversations} />
    <div className="flex min-h-screen min-w-0 flex-1 flex-col">
      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-[color:var(--surface)] shadow-[-4px_0_24px_-8px_rgba(0,0,0,0.05)] md:rounded-l-2xl border-l border-[color:var(--border)] overflow-hidden">
        <ChatHeader />
        <main className="min-h-0 flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  </div>
);
