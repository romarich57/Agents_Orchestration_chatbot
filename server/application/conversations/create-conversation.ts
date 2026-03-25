import "server-only";

import { PrismaConversationRepository } from "@/server/infrastructure/repositories/prisma-conversation-repository";

export class CreateConversationUseCase {
  constructor(private readonly repository: PrismaConversationRepository) {}

  async execute(title?: string) {
    return this.repository.create(title);
  }
}
