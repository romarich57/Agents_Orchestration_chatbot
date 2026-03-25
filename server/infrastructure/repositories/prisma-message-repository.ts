import "server-only";

import type { MessageStatus, Prisma } from "@prisma/client";
import type { MessageDto } from "@/features/chat/types/chat";
import type { DatabaseClient } from "@/server/infrastructure/db/transaction";
import { toMessageDto } from "@/server/infrastructure/repositories/prisma-mappers";

type AttachmentSeed = {
  originalName: string;
  mimeType: string;
  size: number;
  status: "uploaded" | "reused" | "failed";
  storageKey: string;
  checksum: string | null;
};

export class PrismaMessageRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findByClientRequestId(conversationId: string, clientRequestId: string) {
    return this.db.message.findFirst({
      where: {
        conversationId,
        clientRequestId,
      },
      include: {
        attachments: true,
      },
    });
  }

  async createUserMessage(params: {
    conversationId: string;
    content: string;
    clientRequestId: string;
    attachments: AttachmentSeed[];
  }) {
    return this.db.message.create({
      data: {
        conversationId: params.conversationId,
        role: "user",
        content: params.content,
        status: "completed",
        clientRequestId: params.clientRequestId,
        attachments: {
          create: params.attachments,
        },
      },
      include: {
        attachments: true,
      },
    });
  }

  async createAssistantMessage(params: {
    conversationId: string;
    userMessageId: string;
  }) {
    return this.db.message.create({
      data: {
        conversationId: params.conversationId,
        role: "assistant",
        status: "pending",
        metadata: {
          userMessageId: params.userMessageId,
        } satisfies Prisma.JsonObject,
      },
      include: {
        attachments: true,
      },
    });
  }

  async updateAssistantStreaming(id: string, content: string, status: MessageStatus) {
    return this.db.message.update({
      where: { id },
      data: {
        content,
        status,
      },
      include: {
        attachments: true,
      },
    });
  }

  async completeAssistantMessage(params: {
    id: string;
    content: string;
    metadata?: Prisma.JsonObject;
    providerMessageId?: string;
  }) {
    return this.db.message.update({
      where: { id: params.id },
      data: {
        content: params.content,
        status: "completed",
        metadata: params.metadata,
        providerMessageId: params.providerMessageId,
        error: null,
      },
      include: {
        attachments: true,
      },
    });
  }

  async failAssistantMessage(params: {
    id: string;
    content: string;
    error: string;
    metadata?: Prisma.JsonObject;
  }) {
    return this.db.message.update({
      where: { id: params.id },
      data: {
        content: params.content,
        status: "failed",
        error: params.error,
        metadata: params.metadata,
      },
      include: {
        attachments: true,
      },
    });
  }

  async findAssistantForUserMessageId(conversationId: string, userMessageId: string) {
    const candidates = await this.db.message.findMany({
      where: {
        conversationId,
        role: "assistant",
      },
      include: {
        attachments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return (
      candidates.find((message) => {
        if (!message.metadata || typeof message.metadata !== "object") {
          return false;
        }

        const metadata = message.metadata as Record<string, unknown>;

        return metadata.userMessageId === userMessageId;
      }) ?? null
    );
  }

  toDto(message: Awaited<ReturnType<PrismaMessageRepository["createUserMessage"]>>): MessageDto {
    return toMessageDto(message);
  }
}
