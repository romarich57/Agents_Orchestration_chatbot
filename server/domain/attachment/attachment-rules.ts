import "server-only";

import { getEnv } from "@/lib/config/env";
import { ApplicationError } from "@/server/shared/errors/application-error";

export const validateIncomingFiles = (files: File[]) => {
  const env = getEnv();

  if (files.length > env.MAX_ATTACHMENTS_PER_MESSAGE) {
    throw new ApplicationError({
      code: "BAD_REQUEST",
      httpStatus: 400,
      message: `Vous ne pouvez pas joindre plus de ${env.MAX_ATTACHMENTS_PER_MESSAGE} fichiers.`,
    });
  }

  files.forEach((file) => {
    const fileSizeMb = file.size / (1024 * 1024);

    if (fileSizeMb > env.MAX_FILE_SIZE_MB) {
      throw new ApplicationError({
        code: "BAD_REQUEST",
        httpStatus: 400,
        message: `Le fichier ${file.name} dépasse la limite de ${env.MAX_FILE_SIZE_MB} Mo.`,
      });
    }

    if (!env.ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
      throw new ApplicationError({
        code: "BAD_REQUEST",
        httpStatus: 400,
        message: `Le type ${file.type || "inconnu"} n'est pas autorisé.`,
      });
    }
  });
};
