"use client";

import { Menu } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useChatUiStore } from "@/features/chat/stores/chat-ui-store";

export const ChatHeader = () => {
  const setMobileSidebarOpen = useChatUiStore((state) => state.setMobileSidebarOpen);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-[color:var(--border)] px-6 py-4">
      <div className="flex items-center gap-3">
        <IconButton
          className="md:hidden"
          aria-label="Ouvrir la sidebar"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu className="size-4" />
        </IconButton>
        <div>
          <p className="font-[family-name:var(--font-display)] text-sm font-medium text-[color:var(--foreground)]">
            Sim Studio Chat
          </p>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
};
