import "server-only";

import { PrismaConversationRepository } from "@/server/infrastructure/repositories/prisma-conversation-repository";

export class ListConversationsUseCase {
  constructor(private readonly repository: PrismaConversationRepository) {}

  async execute() {
    return this.repository.list();
  }
}
