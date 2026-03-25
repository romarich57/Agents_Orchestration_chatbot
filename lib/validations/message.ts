import { z } from "zod";

const stringFileSchema = z.instanceof(File);

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Le message ne peut pas être vide").max(12_000),
  clientRequestId: z.string().trim().min(8).max(128),
  files: z.array(stringFileSchema).max(10),
});
