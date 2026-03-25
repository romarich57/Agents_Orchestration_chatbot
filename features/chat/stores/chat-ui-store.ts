"use client";

import { create } from "zustand";

type ChatUiState = {
  mobileSidebarOpen: boolean;
  streamingConversationId: string | null;
  setMobileSidebarOpen: (open: boolean) => void;
  setStreamingConversationId: (conversationId: string | null) => void;
};

export const useChatUiStore = create<ChatUiState>((set) => ({
  mobileSidebarOpen: false,
  streamingConversationId: null,
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
  setStreamingConversationId: (streamingConversationId) => set({ streamingConversationId }),
}));
