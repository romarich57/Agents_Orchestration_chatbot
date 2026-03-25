import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/server/infrastructure/db/prisma";

export type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export const withTransaction = async <T>(
  callback: (transaction: Prisma.TransactionClient) => Promise<T>,
) => prisma.$transaction(callback);
