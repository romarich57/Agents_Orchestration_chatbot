"use client";

import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConversationListItem } from "@/features/conversations/components/conversation-list-item";
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useRenameConversation,
} from "@/features/conversations/hooks/use-conversations";
import { useChatUiStore } from "@/features/chat/stores/chat-ui-store";
import type { ConversationSummaryDto } from "@/features/conversations/types/conversation";

export const ConversationSidebar = ({
  initialConversations,
}: {
  initialConversations: ConversationSummaryDto[];
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: conversations } = useConversations(initialConversations);
  const createMutation = useCreateConversation();
  const renameMutation = useRenameConversation();
  const deleteMutation = useDeleteConversation();
  const mobileSidebarOpen = useChatUiStore((state) => state.mobileSidebarOpen);
  const setMobileSidebarOpen = useChatUiStore((state) => state.setMobileSidebarOpen);

  const handleCreate = async () => {
    const conversation = await createMutation.mutateAsync(undefined);
    router.push(`/conversations/${conversation.id}`);
    setMobileSidebarOpen(false);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[18rem] flex-col border-r border-[color:var(--border)] bg-[color:var(--sidebar-surface)] px-4 py-6 transition-transform duration-300 ease-in-out md:static md:z-0 md:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Conversations
            </p>
          </div>
        </div>

        <Button
          className="mb-6 w-full justify-start rounded-2xl px-5 py-3.5 text-[0.95rem] font-medium"
          onClick={() => void handleCreate()}
          variant="secondary"
        >
          {createMutation.isPending ? <Spinner /> : <Plus className="size-4 opacity-70" />}
          Nouvelle conversation
        </Button>

        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {conversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--panel-elevated)] px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">
              Aucune conversation
            </div>
          ) : (
            conversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                isActive={pathname === `/conversations/${conversation.id}`}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === conversation.id}
                onRename={async (title) => {
                  await renameMutation.mutateAsync({
                    id: conversation.id,
                    title,
                  });
                }}
                onDelete={async () => {
                  await deleteMutation.mutateAsync(conversation.id);

                  if (pathname === `/conversations/${conversation.id}`) {
                    router.push("/");
                  }
                }}
              />
            ))
          )}
        </div>
      </aside>
    </>
  );
};
