import "server-only";

import { PrismaConversationRepository } from "@/server/infrastructure/repositories/prisma-conversation-repository";
import { ApplicationError } from "@/server/shared/errors/application-error";

export class GetConversationUseCase {
  constructor(private readonly repository: PrismaConversationRepository) {}

  async execute(id: string) {
    const conversation = await this.repository.getDetail(id);

    if (!conversation) {
      throw new ApplicationError({
        code: "NOT_FOUND",
        httpStatus: 404,
        message: "Conversation introuvable.",
      });
    }

    return conversation;
  }
}
