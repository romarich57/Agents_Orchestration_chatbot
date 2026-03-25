import { mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/config/env";
import { prisma } from "@/server/infrastructure/db/prisma";

export const runtime = "nodejs";

export async function GET() {
  const env = getEnv();
  const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);

  let dbStatus: "ok" | "error" = "ok";
  let uploadsStatus: "ok" | "error" = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  try {
    await mkdir(uploadDir, { recursive: true });
  } catch {
    uploadsStatus = "error";
  }

  const simConfigStatus =
    env.SIM_API_KEY && env.SIM_WORKFLOW_ID ? "configured" : "missing";

  return NextResponse.json({
    status: dbStatus === "ok" && uploadsStatus === "ok" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    services: {
      db: dbStatus,
      uploads: uploadsStatus,
      simConfig: simConfigStatus,
    },
  });
}
