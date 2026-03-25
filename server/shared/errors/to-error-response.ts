import "server-only";

import { NextResponse } from "next/server";
import { ApplicationError } from "@/server/shared/errors/application-error";

export const toErrorResponse = (error: unknown) => {
  if (error instanceof ApplicationError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
      },
      { status: error.httpStatus },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Une erreur inattendue est survenue.",
      },
    },
    { status: 500 },
  );
};
