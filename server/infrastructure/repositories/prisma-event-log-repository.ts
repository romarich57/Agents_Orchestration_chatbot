import "server-only";

import type { EventLogLevel, Prisma } from "@prisma/client";
import type { DatabaseClient } from "@/server/infrastructure/db/transaction";

export class PrismaEventLogRepository {
  constructor(private readonly db: DatabaseClient) {}

  async create(params: {
    kind: string;
    level?: EventLogLevel;
    conversationId?: string;
    messageId?: string;
    durationMs?: number;
    payload: Record<string, unknown>;
  }) {
    await this.db.eventLog.create({
      data: {
        kind: params.kind,
        level: params.level ?? "info",
        conversationId: params.conversationId,
        messageId: params.messageId,
        durationMs: params.durationMs,
        payload: params.payload as Prisma.JsonObject,
      },
    });
  }
}
