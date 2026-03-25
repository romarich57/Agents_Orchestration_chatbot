import type { AttachmentDto } from "@/features/attachments/types/attachment";

export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "pending" | "streaming" | "completed" | "failed";

export type MessageDto = {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  clientRequestId: string | null;
  providerMessageId: string | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  attachments: AttachmentDto[];
};

export type StreamAcceptedEvent = {
  type: "message.accepted";
  userMessageId: string;
  assistantMessageId: string;
  conversationId: string;
};

export type StreamStartedEvent = {
  type: "assistant.started";
  assistantMessageId: string;
};

export type StreamDeltaEvent = {
  type: "assistant.delta";
  assistantMessageId: string;
  delta: string;
  blockId?: string;
};

export type StreamCompletedEvent = {
  type: "assistant.completed";
  assistantMessageId: string;
  content: string;
  metadata: Record<string, unknown> | null;
};

export type StreamFailedEvent = {
  type: "assistant.failed";
  assistantMessageId: string;
  errorCode: string;
  message: string;
};

export type StreamConversationUpdatedEvent = {
  type: "conversation.updated";
  conversation: {
    id: string;
    title: string;
    updatedAt: string;
    status: string;
  };
};

export type StreamDoneEvent = {
  type: "done";
  ok: true;
};

export type ChatStreamEvent =
  | StreamAcceptedEvent
  | StreamStartedEvent
  | StreamDeltaEvent
  | StreamCompletedEvent
  | StreamFailedEvent
  | StreamConversationUpdatedEvent
  | StreamDoneEvent;
