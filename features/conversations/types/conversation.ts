import type { MessageDto } from "@/features/chat/types/chat";

export type ConversationStatus = "idle" | "streaming" | "error" | "archived";

export type ConversationSummaryDto = {
  id: string;
  title: string;
  status: ConversationStatus;
  updatedAt: string;
  createdAt: string;
};

export type ConversationDetailDto = {
  id: string;
  title: string;
  titleManuallyEdited: boolean;
  simMemoryKey: string;
  status: ConversationStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  messages: MessageDto[];
};
