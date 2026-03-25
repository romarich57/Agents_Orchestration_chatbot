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
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden border-l border-[color:var(--border)] bg-[color:var(--workspace-surface)] shadow-[var(--shadow-lg)] md:rounded-l-[1.75rem]">
        <ChatHeader />
        <main className="min-h-0 flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  </div>
);
