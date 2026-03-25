export const conversationQueryKeys = {
  all: ["conversations"] as const,
  detail: (id: string) => ["conversations", id] as const,
};
