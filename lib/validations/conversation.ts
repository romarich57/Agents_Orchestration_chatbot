import { z } from "zod";

export const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(60).optional(),
});

export const renameConversationSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(60),
});
