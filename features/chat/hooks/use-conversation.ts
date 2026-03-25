"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchConversation } from "@/features/conversations/api/conversation-api";
import { conversationQueryKeys } from "@/features/conversations/query-keys";
import type { ConversationDetailDto } from "@/features/conversations/types/conversation";

export const useConversation = (id: string, initialData: ConversationDetailDto) =>
  useQuery({
    queryKey: conversationQueryKeys.detail(id),
    queryFn: () => fetchConversation(id),
    initialData,
  });
