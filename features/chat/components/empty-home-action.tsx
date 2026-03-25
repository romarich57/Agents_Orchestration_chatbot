"use client";

import { useRouter } from "next/navigation";
import { EmptyChatState } from "@/features/chat/components/empty-chat-state";
import { useCreateConversation } from "@/features/conversations/hooks/use-conversations";

export const EmptyHomeAction = () => {
  const router = useRouter();
  const createConversation = useCreateConversation();

  return (
    <EmptyChatState
      onCreateConversation={() => {
        void createConversation.mutateAsync(undefined).then((conversation) => {
          router.push(`/conversations/${conversation.id}`);
        });
      }}
    />
  );
};
