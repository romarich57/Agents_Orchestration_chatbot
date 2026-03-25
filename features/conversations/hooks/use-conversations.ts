"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createConversation,
  deleteConversation,
  fetchConversations,
  renameConversation,
} from "@/features/conversations/api/conversation-api";
import { conversationQueryKeys } from "@/features/conversations/query-keys";
import type { ConversationSummaryDto } from "@/features/conversations/types/conversation";

export const useConversations = (initialData: ConversationSummaryDto[]) =>
  useQuery({
    queryKey: conversationQueryKeys.all,
    queryFn: fetchConversations,
    initialData,
  });

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title?: string) => createConversation(title),
    onSuccess: (conversation) => {
      queryClient.setQueryData<ConversationSummaryDto[]>(
        conversationQueryKeys.all,
        (current = []) => [conversation, ...current],
      );
    },
  });
};

export const useRenameConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renameConversation(id, title),
    onSuccess: (conversation) => {
      queryClient.setQueryData<ConversationSummaryDto[]>(
        conversationQueryKeys.all,
        (current = []) =>
          current.map((item) => (item.id === conversation.id ? conversation : item)),
      );
      queryClient.invalidateQueries({ queryKey: conversationQueryKeys.detail(conversation.id) });
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<ConversationSummaryDto[]>(
        conversationQueryKeys.all,
        (current = []) => current.filter((conversation) => conversation.id !== id),
      );
      queryClient.removeQueries({ queryKey: conversationQueryKeys.detail(id) });
    },
  });
};
