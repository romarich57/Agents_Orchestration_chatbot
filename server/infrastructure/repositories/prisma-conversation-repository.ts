import "server-only";

import type { ConversationStatus } from "@prisma/client";
import { nanoid } from "nanoid";
import type { ConversationDetailDto, ConversationSummaryDto } from "@/features/conversations/types/conversation";
import type { DatabaseClient } from "@/server/infrastructure/db/transaction";
import {
  toConversationDetailDto,
  toConversationSummaryDto,
} from "@/server/infrastructure/repositories/prisma-mappers";

export class PrismaConversationRepository {
  constructor(private readonly db: DatabaseClient) {}

  async create(title?: string): Promise<ConversationSummaryDto> {
    const conversation = await this.db.conversation.create({
      data: {
        title: title?.trim() || "Nouvelle conversation",
        simMemoryKey: `conv_${nanoid(16)}`,
      },
    });

    return toConversationSummaryDto(conversation);
  }

  async list(): Promise<ConversationSummaryDto[]> {
    const conversations = await this.db.conversation.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return conversations.map(toConversationSummaryDto);
  }

  async getDetail(id: string): Promise<ConversationDetailDto | null> {
    const conversation = await this.db.conversation.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        messages: {
          include: {
            attachments: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return conversation ? toConversationDetailDto(conversation) : null;
  }

  async findEntity(id: string) {
    return this.db.conversation.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async rename(id: string, title: string): Promise<ConversationSummaryDto | null> {
    const conversation = await this.db.conversation.update({
      where: { id },
      data: {
        title,
        titleManuallyEdited: true,
      },
    });

    return toConversationSummaryDto(conversation);
  }

  async softDelete(id: string): Promise<void> {
    await this.db.conversation.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async updateStatus(id: string, status: ConversationStatus) {
    const conversation = await this.db.conversation.update({
      where: { id },
      data: { status },
    });

    return toConversationSummaryDto(conversation);
  }

  async touch(id: string) {
    await this.db.conversation.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  async updateGeneratedTitle(id: string, title: string) {
    await this.db.conversation.updateMany({
      where: {
        id,
        titleManuallyEdited: false,
      },
      data: {
        title,
      },
    });
  }
}
