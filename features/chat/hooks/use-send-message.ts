"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { streamConversationMessage } from "@/features/chat/api/chat-api";
import type { MessageDto } from "@/features/chat/types/chat";
import { conversationQueryKeys } from "@/features/conversations/query-keys";
import type {
  ConversationDetailDto,
  ConversationSummaryDto,
} from "@/features/conversations/types/conversation";
import { useChatUiStore } from "@/features/chat/stores/chat-ui-store";

const buildOptimisticMessage = (params: {
  id: string;
  conversationId: string;
  role: MessageDto["role"];
  content: string;
  status: MessageDto["status"];
  clientRequestId: string | null;
}) => ({
  id: params.id,
  conversationId: params.conversationId,
  role: params.role,
  content: params.content,
  status: params.status,
  clientRequestId: params.clientRequestId,
  providerMessageId: null,
  error: null,
  metadata: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  attachments: [],
} satisfies MessageDto);

export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();
  const setStreamingConversationId = useChatUiStore(
    (state) => state.setStreamingConversationId,
  );

  return useMutation({
    mutationFn: async ({ content, files }: { content: string; files: File[] }) => {
      const clientRequestId = crypto.randomUUID?.() ?? nanoid();
      const optimisticUserId = `temp-user-${clientRequestId}`;
      const optimisticAssistantId = `temp-assistant-${clientRequestId}`;

      queryClient.setQueryData<ConversationDetailDto | undefined>(
        conversationQueryKeys.detail(conversationId),
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            status: "streaming",
            messages: [
              ...current.messages,
              buildOptimisticMessage({
                id: optimisticUserId,
                conversationId,
                role: "user",
                content,
                status: "completed",
                clientRequestId,
              }),
              buildOptimisticMessage({
                id: optimisticAssistantId,
                conversationId,
                role: "assistant",
                content: "",
                status: "streaming",
                clientRequestId: null,
              }),
            ],
          };
        },
      );

      queryClient.setQueryData<ConversationSummaryDto[]>(
        conversationQueryKeys.all,
        (current = []) =>
          current.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  updatedAt: new Date().toISOString(),
                  status: "streaming",
                }
              : conversation,
          ),
      );

      setStreamingConversationId(conversationId);

      let assistantMessageId = optimisticAssistantId;
      let userMessageId = optimisticUserId;

      await streamConversationMessage({
        conversationId,
        content,
        clientRequestId,
        files,
        onEvent: (event) => {
          queryClient.setQueryData<ConversationDetailDto | undefined>(
            conversationQueryKeys.detail(conversationId),
            (current) => {
              if (!current) {
                return current;
              }

              if (event.type === "message.accepted") {
                assistantMessageId = event.assistantMessageId;
                userMessageId = event.userMessageId;

                return {
                  ...current,
                  messages: current.messages.map((message) => {
                    if (message.id === optimisticUserId) {
                      return { ...message, id: userMessageId };
                    }

                    if (message.id === optimisticAssistantId) {
                      return { ...message, id: assistantMessageId };
                    }

                    return message;
                  }),
                };
              }

              if (event.type === "assistant.delta") {
                return {
                  ...current,
                  messages: current.messages.map((message) =>
                    message.id === assistantMessageId
                      ? {
                          ...message,
                          status: "streaming",
                          content: `${message.content}${event.delta}`,
                        }
                      : message,
                  ),
                };
              }

              if (event.type === "assistant.completed") {
                return {
                  ...current,
                  status: "idle",
                  messages: current.messages.map((message) =>
                    message.id === assistantMessageId
                      ? {
                          ...message,
                          status: "completed",
                          content: event.content,
                          metadata: event.metadata,
                          error: null,
                        }
                      : message,
                  ),
                };
              }

              if (event.type === "assistant.failed") {
                toast.error(event.message);

                return {
                  ...current,
                  status: "error",
                  messages: current.messages.map((message) =>
                    message.id === assistantMessageId
                      ? {
                          ...message,
                          status: "failed",
                          error: event.message,
                        }
                      : message,
                  ),
                };
              }

              return current;
            },
          );

          if (event.type === "conversation.updated") {
            queryClient.setQueryData<ConversationSummaryDto[]>(
              conversationQueryKeys.all,
              (current = []) =>
                current.map((conversation) =>
                  conversation.id === event.conversation.id
                    ? {
                        ...conversation,
                        title: event.conversation.title,
                        status: event.conversation.status as ConversationSummaryDto["status"],
                        updatedAt: event.conversation.updatedAt,
                      }
                    : conversation,
                ),
            );
          }

          if (event.type === "done") {
            setStreamingConversationId(null);
          }
        },
      });

      queryClient.invalidateQueries({ queryKey: conversationQueryKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: conversationQueryKeys.all });
    },
    onError: (error) => {
      setStreamingConversationId(null);
      toast.error(error instanceof Error ? error.message : "L'envoi a échoué.");
      queryClient.invalidateQueries({ queryKey: conversationQueryKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: conversationQueryKeys.all });
    },
  });
};
