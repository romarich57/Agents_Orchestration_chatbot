import "server-only";

import { PrismaConversationRepository } from "@/server/infrastructure/repositories/prisma-conversation-repository";
import { PrismaEventLogRepository } from "@/server/infrastructure/repositories/prisma-event-log-repository";
import { PrismaMessageRepository } from "@/server/infrastructure/repositories/prisma-message-repository";
import { buildConversationTitle } from "@/server/domain/conversation/conversation-title";
import { validateIncomingFiles } from "@/server/domain/attachment/attachment-rules";
import { ensureMessageContent } from "@/server/domain/message/message-guards";
import type { AttachmentStoragePort } from "@/server/application/attachments/attachment-storage.port";
import type { ChatStreamEvent } from "@/features/chat/types/chat";
import type { SimWorkflowPort } from "@/server/application/sim/sim-workflow.port";
import { ApplicationError } from "@/server/shared/errors/application-error";
import { withTransaction } from "@/server/infrastructure/db/transaction";
import { PrismaConversationRepository as ConversationRepoInTx } from "@/server/infrastructure/repositories/prisma-conversation-repository";
import { PrismaEventLogRepository as EventLogRepoInTx } from "@/server/infrastructure/repositories/prisma-event-log-repository";
import { PrismaMessageRepository as MessageRepoInTx } from "@/server/infrastructure/repositories/prisma-message-repository";
import { getEnv } from "@/lib/config/env";

type StreamEmitter = (event: ChatStreamEvent) => Promise<void> | void;

export class SendMessageAndStreamAssistantReplyUseCase {
  constructor(
    private readonly conversationRepository: PrismaConversationRepository,
    private readonly messageRepository: PrismaMessageRepository,
    private readonly eventLogRepository: PrismaEventLogRepository,
    private readonly storage: AttachmentStoragePort,
    private readonly simWorkflow: SimWorkflowPort,
  ) {}

  async execute(params: {
    conversationId: string;
    content: string;
    clientRequestId: string;
    files: File[];
    signal?: AbortSignal;
    emit: StreamEmitter;
  }) {
    const startedAt = Date.now();
    ensureMessageContent(params.content);
    validateIncomingFiles(params.files);

    const conversation = await this.conversationRepository.findEntity(params.conversationId);

    if (!conversation) {
      throw new ApplicationError({
        code: "NOT_FOUND",
        httpStatus: 404,
        message: "Conversation introuvable.",
      });
    }

    const existingUserMessage = await this.messageRepository.findByClientRequestId(
      params.conversationId,
      params.clientRequestId,
    );

    if (existingUserMessage) {
      const existingAssistant = await this.messageRepository.findAssistantForUserMessageId(
        params.conversationId,
        existingUserMessage.id,
      );

      if (existingAssistant) {
        await params.emit({
          type: "message.accepted",
          userMessageId: existingUserMessage.id,
          assistantMessageId: existingAssistant.id,
          conversationId: params.conversationId,
        });

        await params.emit({
          type: "assistant.completed",
          assistantMessageId: existingAssistant.id,
          content: existingAssistant.content,
          metadata:
            existingAssistant.metadata && typeof existingAssistant.metadata === "object"
              ? (existingAssistant.metadata as Record<string, unknown>)
              : null,
        });

        await params.emit({
          type: "done",
          ok: true,
        });

        return;
      }
    }

    const seedMessageId = `seed_${params.clientRequestId}`;
    const storedAttachments = await this.storage.store({
      conversationId: params.conversationId,
      messageId: seedMessageId,
      files: params.files,
    });

    const persistedMessages = await withTransaction(async (transaction) => {
      const txConversationRepository = new ConversationRepoInTx(transaction);
      const txMessageRepository = new MessageRepoInTx(transaction);

      const userMessage = await txMessageRepository.createUserMessage({
        conversationId: params.conversationId,
        content: params.content,
        clientRequestId: params.clientRequestId,
        attachments: storedAttachments.map((attachment) => ({
          originalName: attachment.originalName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          status: "uploaded",
          storageKey: attachment.storageKey,
          checksum: attachment.checksum,
        })),
      });

      const assistantMessage = await txMessageRepository.createAssistantMessage({
        conversationId: params.conversationId,
        userMessageId: userMessage.id,
      });

      await txConversationRepository.updateStatus(params.conversationId, "streaming");

      return { userMessage, assistantMessage };
    });

    await params.emit({
      type: "message.accepted",
      userMessageId: persistedMessages.userMessage.id,
      assistantMessageId: persistedMessages.assistantMessage.id,
      conversationId: params.conversationId,
    });

    await params.emit({
      type: "assistant.started",
      assistantMessageId: persistedMessages.assistantMessage.id,
    });

    let content = "";
    let providerMessageId: string | undefined;
    let chunkCount = 0;
    let lastMetadata: Record<string, unknown> | undefined;
    let hadTerminalOutput = false;
    let usedFinalOutputFallback = false;
    const simSelectedOutputs = getEnv().SIM_SELECTED_OUTPUTS;

    try {
      for await (const chunk of this.simWorkflow.runWorkflowStream({
        workflowId: getEnv().SIM_WORKFLOW_ID,
        prompt: params.content,
        memoryKey: conversation.simMemoryKey,
        files: storedAttachments.map((attachment) => ({
          name: attachment.originalName,
          mimeType: attachment.mimeType,
          contentBase64: attachment.contentBase64,
        })),
        selectedOutputs: getEnv().SIM_SELECTED_OUTPUTS,
        signal: params.signal,
      })) {
        if (chunk.type === "delta" && chunk.delta) {
          chunkCount += 1;
          content += chunk.delta;
          providerMessageId = chunk.providerMessageId ?? providerMessageId;
          lastMetadata = chunk.metadata ?? lastMetadata;

          await params.emit({
            type: "assistant.delta",
            assistantMessageId: persistedMessages.assistantMessage.id,
            delta: chunk.delta,
            blockId: chunk.blockId,
          });

          await this.messageRepository.updateAssistantStreaming(
            persistedMessages.assistantMessage.id,
            content,
            "streaming",
          );
        }

        if (chunk.type === "metadata" && chunk.metadata) {
          lastMetadata = chunk.metadata;
        }

        if (chunk.type === "final") {
          hadTerminalOutput = true;
          usedFinalOutputFallback = chunkCount === 0;
          content = chunk.content;
          lastMetadata = chunk.metadata ?? lastMetadata;
        }

        if (chunk.type === "error") {
          throw new ApplicationError({
            code: "UPSTREAM_ERROR",
            httpStatus: 502,
            message: chunk.error || "Le streaming Sim Studio a échoué.",
            details: chunk.metadata,
          });
        }
      }

      if (!content.trim()) {
        throw new ApplicationError({
          code: "UPSTREAM_EMPTY_RESPONSE",
          httpStatus: 502,
          message: "Le workflow Sim n'a renvoyé aucun contenu textuel exploitable.",
          details: {
            simSelectedOutputs,
          },
        });
      }

      const finalMessage = await this.messageRepository.completeAssistantMessage({
        id: persistedMessages.assistantMessage.id,
        content,
        metadata: {
          ...(lastMetadata ?? {}),
          chunkCount,
          hadTerminalOutput,
          usedFinalOutputFallback,
          simSelectedOutputs,
          userMessageId: persistedMessages.userMessage.id,
        },
        providerMessageId,
      });

      if (!conversation.titleManuallyEdited && conversation.title === "Nouvelle conversation") {
        await this.conversationRepository.updateGeneratedTitle(
          params.conversationId,
          buildConversationTitle(params.content),
        );
      }

      const updatedConversation = await this.conversationRepository.updateStatus(
        params.conversationId,
        "idle",
      );

      await this.eventLogRepository.create({
        kind: "message.stream.completed",
        conversationId: params.conversationId,
        messageId: finalMessage.id,
        durationMs: Date.now() - startedAt,
        payload: {
          chunkCount,
          hadTerminalOutput,
          usedFinalOutputFallback,
          simSelectedOutputs,
        },
      });

      await params.emit({
        type: "assistant.completed",
        assistantMessageId: finalMessage.id,
        content: finalMessage.content,
        metadata:
          finalMessage.metadata && typeof finalMessage.metadata === "object"
            ? (finalMessage.metadata as Record<string, unknown>)
            : null,
      });

      await params.emit({
        type: "conversation.updated",
        conversation: {
          id: updatedConversation.id,
          title: updatedConversation.title,
          updatedAt: updatedConversation.updatedAt,
          status: updatedConversation.status,
        },
      });

      await params.emit({
        type: "done",
        ok: true,
      });
    } catch (error) {
      const message =
        error instanceof ApplicationError ? error.message : "La réponse de l'assistant a échoué.";

      await this.messageRepository.failAssistantMessage({
        id: persistedMessages.assistantMessage.id,
        content,
        error: message,
        metadata: {
          ...(lastMetadata ?? {}),
          userMessageId: persistedMessages.userMessage.id,
          partialContent: content,
          hadTerminalOutput,
          simSelectedOutputs,
        },
      });

      const updatedConversation = await this.conversationRepository.updateStatus(
        params.conversationId,
        "error",
      );

      await this.eventLogRepository.create({
        kind: "message.stream.failed",
        level: "error",
        conversationId: params.conversationId,
        messageId: persistedMessages.assistantMessage.id,
        durationMs: Date.now() - startedAt,
        payload: {
          error: message,
          chunkCount,
          hadTerminalOutput,
          usedFinalOutputFallback,
          simSelectedOutputs,
        },
      });

      await params.emit({
        type: "assistant.failed",
        assistantMessageId: persistedMessages.assistantMessage.id,
        errorCode: error instanceof ApplicationError ? error.code : "INTERNAL_ERROR",
        message,
      });

      await params.emit({
        type: "conversation.updated",
        conversation: {
          id: updatedConversation.id,
          title: updatedConversation.title,
          updatedAt: updatedConversation.updatedAt,
          status: updatedConversation.status,
        },
      });

      await params.emit({
        type: "done",
        ok: true,
      });
    }
  }
}
