import "server-only";

import { ApplicationError } from "@/server/shared/errors/application-error";

export const ensureMessageContent = (content: string) => {
  if (!content.trim()) {
    throw new ApplicationError({
      code: "BAD_REQUEST",
      httpStatus: 400,
      message: "Le message ne peut pas être vide.",
    });
  }
};
