import "server-only";

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getEnv } from "@/lib/config/env";
import type {
  AttachmentStoragePort,
  StoredAttachment,
} from "@/server/application/attachments/attachment-storage.port";

const sanitizeName = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");

export class LocalDiskAttachmentStorage implements AttachmentStoragePort {
  async store(params: {
    conversationId: string;
    messageId: string;
    files: File[];
  }): Promise<StoredAttachment[]> {
    const env = getEnv();
    const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR, params.conversationId, params.messageId);

    await mkdir(uploadDir, { recursive: true });

    return Promise.all(
      params.files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const checksum = createHash("sha256").update(buffer).digest("hex");
        const safeName = sanitizeName(file.name) || "attachment";
        const fileName = `${checksum.slice(0, 12)}-${safeName}`;
        const absolutePath = path.join(uploadDir, fileName);
        const storageKey = path.relative(path.resolve(process.cwd(), env.UPLOAD_DIR), absolutePath);

        await writeFile(absolutePath, buffer);

        return {
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          storageKey,
          checksum,
          contentBase64: buffer.toString("base64"),
        };
      }),
    );
  }
}
