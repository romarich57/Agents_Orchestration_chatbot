import "server-only";

import { PrismaConversationRepository } from "@/server/infrastructure/repositories/prisma-conversation-repository";
import { ApplicationError } from "@/server/shared/errors/application-error";

export class RenameConversationUseCase {
  constructor(private readonly repository: PrismaConversationRepository) {}

  async execute(id: string, title: string) {
    const entity = await this.repository.findEntity(id);

    if (!entity) {
      throw new ApplicationError({
        code: "NOT_FOUND",
        httpStatus: 404,
        message: "Conversation introuvable.",
      });
    }

    return this.repository.rename(id, title);
  }
}
