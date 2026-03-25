"use client";

import { ChatComposer } from "@/features/chat/components/chat-composer";
import { ChatThread } from "@/features/chat/components/chat-thread";
import { useConversation } from "@/features/chat/hooks/use-conversation";
import type { ConversationDetailDto } from "@/features/conversations/types/conversation";

export const ConversationWorkspace = ({
  conversationId,
  initialConversation,
}: {
  conversationId: string;
  initialConversation: ConversationDetailDto;
}) => {
  const { data: conversation } = useConversation(conversationId, initialConversation);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[color:var(--border)] px-4 py-4 md:px-8">
        <p className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          {conversation.title}
        </p>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Statut: {conversation.status}
        </p>
      </div>
      <ChatThread messages={conversation.messages} />
      <ChatComposer conversationId={conversationId} />
    </div>
  );
};
