import type { ChatStreamEvent } from "@/features/chat/types/chat";

export const serializeSseEvent = (event: ChatStreamEvent) =>
  `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
