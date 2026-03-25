import "server-only";

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_BASE_URL: z.string().url(),
  UPLOAD_DIR: z.string().min(1),
  MAX_FILE_SIZE_MB: z.coerce.number().int().positive(),
  MAX_ATTACHMENTS_PER_MESSAGE: z.coerce.number().int().positive().max(10),
  ALLOWED_UPLOAD_MIME_TYPES: z.string().min(1),
  SIM_API_KEY: z.string().default(""),
  SIM_BASE_URL: z.string().url().default("https://www.sim.ai"),
  SIM_WORKFLOW_ID: z.string().default(""),
  SIM_PROMPT_INPUT_KEY: z.string().min(1).default("input"),
  SIM_QUERY_INPUT_KEY: z.string().min(1).default("query"),
  SIM_MEMORY_INPUT_KEY: z.string().min(1).default("conversationId"),
  SIM_FILES_INPUT_KEY: z.string().min(1).default("files"),
  SIM_SELECTED_OUTPUTS: z.string().default(""),
});

let cachedEnv: ReturnType<typeof createEnv> | null = null;

const createEnv = () => {
  const parsed = envSchema.parse(process.env);

  return {
    ...parsed,
    ALLOWED_UPLOAD_MIME_TYPES: parsed.ALLOWED_UPLOAD_MIME_TYPES.split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    SIM_SELECTED_OUTPUTS: parsed.SIM_SELECTED_OUTPUTS.split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  };
};

export const getEnv = () => {
  if (!cachedEnv) {
    cachedEnv = createEnv();
  }

  return cachedEnv;
};
