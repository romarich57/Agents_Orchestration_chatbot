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
  <div className="app-shell flex min-h-screen">
    <ConversationSidebar initialConversations={initialConversations} />
    <div className="flex min-h-screen min-w-0 flex-1 flex-col md:pl-0">
      <div className="surface-panel m-3 flex min-h-[calc(100vh-1.5rem)] min-w-0 flex-1 flex-col overflow-hidden rounded-[2rem]">
        <ChatHeader />
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  </div>
);
