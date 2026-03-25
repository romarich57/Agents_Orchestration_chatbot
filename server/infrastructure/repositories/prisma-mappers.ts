import "server-only";

import type { Attachment, Conversation, Message } from "@prisma/client";
import type { AttachmentDto } from "@/features/attachments/types/attachment";
import type { MessageDto } from "@/features/chat/types/chat";
import type {
  ConversationDetailDto,
  ConversationSummaryDto,
} from "@/features/conversations/types/conversation";

const serializeMetadata = (value: unknown) =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

export const toAttachmentDto = (attachment: Attachment): AttachmentDto => ({
  id: attachment.id,
  originalName: attachment.originalName,
  mimeType: attachment.mimeType,
  size: attachment.size,
  status: attachment.status,
  storageKey: attachment.storageKey,
  checksum: attachment.checksum,
  createdAt: attachment.createdAt.toISOString(),
});

export const toMessageDto = (
  message: Message & { attachments: Attachment[] },
): MessageDto => ({
  id: message.id,
  conversationId: message.conversationId,
  role: message.role,
  content: message.content,
  status: message.status,
  clientRequestId: message.clientRequestId,
  providerMessageId: message.providerMessageId,
  error: message.error,
  metadata: serializeMetadata(message.metadata),
  createdAt: message.createdAt.toISOString(),
  updatedAt: message.updatedAt.toISOString(),
  attachments: message.attachments.map(toAttachmentDto),
});

export const toConversationSummaryDto = (
  conversation: Conversation,
): ConversationSummaryDto => ({
  id: conversation.id,
  title: conversation.title,
  status: conversation.status,
  createdAt: conversation.createdAt.toISOString(),
  updatedAt: conversation.updatedAt.toISOString(),
});

export const toConversationDetailDto = (
  conversation: Conversation & { messages: (Message & { attachments: Attachment[] })[] },
): ConversationDetailDto => ({
  id: conversation.id,
  title: conversation.title,
  titleManuallyEdited: conversation.titleManuallyEdited,
  simMemoryKey: conversation.simMemoryKey,
  status: conversation.status,
  metadata: serializeMetadata(conversation.metadata),
  createdAt: conversation.createdAt.toISOString(),
  updatedAt: conversation.updatedAt.toISOString(),
  messages: conversation.messages.map(toMessageDto),
});
