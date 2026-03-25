import "server-only";

import { prisma } from "@/server/infrastructure/db/prisma";
import { PrismaConversationRepository } from "@/server/infrastructure/repositories/prisma-conversation-repository";
import { PrismaEventLogRepository } from "@/server/infrastructure/repositories/prisma-event-log-repository";
import { PrismaMessageRepository } from "@/server/infrastructure/repositories/prisma-message-repository";
import { LocalDiskAttachmentStorage } from "@/server/infrastructure/storage/local-disk-attachment-storage";
import { SimRestWorkflowClient } from "@/server/infrastructure/sim/sim-rest-workflow-client";
import { CreateConversationUseCase } from "@/server/application/conversations/create-conversation";
import { DeleteConversationUseCase } from "@/server/application/conversations/delete-conversation";
import { GetConversationUseCase } from "@/server/application/conversations/get-conversation";
import { ListConversationsUseCase } from "@/server/application/conversations/list-conversations";
import { RenameConversationUseCase } from "@/server/application/conversations/rename-conversation";
import { SendMessageAndStreamAssistantReplyUseCase } from "@/server/application/messages/send-message-and-stream-assistant-reply";

const conversationRepository = new PrismaConversationRepository(prisma);
const messageRepository = new PrismaMessageRepository(prisma);
const eventLogRepository = new PrismaEventLogRepository(prisma);
const attachmentStorage = new LocalDiskAttachmentStorage();
const simWorkflowClient = new SimRestWorkflowClient();

export const serverContainer = {
  repositories: {
    conversationRepository,
    messageRepository,
    eventLogRepository,
  },
  useCases: {
    createConversation: new CreateConversationUseCase(conversationRepository),
    listConversations: new ListConversationsUseCase(conversationRepository),
    getConversation: new GetConversationUseCase(conversationRepository),
    renameConversation: new RenameConversationUseCase(conversationRepository),
    deleteConversation: new DeleteConversationUseCase(conversationRepository),
    sendMessageAndStreamAssistantReply: new SendMessageAndStreamAssistantReplyUseCase(
      conversationRepository,
      messageRepository,
      eventLogRepository,
      attachmentStorage,
      simWorkflowClient,
    ),
  },
};
