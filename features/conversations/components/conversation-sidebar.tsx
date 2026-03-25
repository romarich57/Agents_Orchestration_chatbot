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
        className={`fixed inset-0 z-30 bg-black/35 transition md:hidden ${
          mobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />
      <aside
        className={`glass-panel fixed inset-y-0 left-0 z-40 flex w-[20rem] flex-col border-r border-[color:var(--border)] px-4 py-4 transition md:static md:z-0 md:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Conversations
            </p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">
              Historique persistant côté produit
            </p>
          </div>
        </div>

        <Button className="mb-4 w-full justify-start" onClick={() => void handleCreate()}>
          {createMutation.isPending ? <Spinner /> : <Plus className="size-4" />}
          Nouvelle conversation
        </Button>

        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {conversations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[color:var(--border)] px-4 py-6 text-sm text-[color:var(--muted)]">
              Aucune conversation pour l’instant.
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
                  const confirmed = window.confirm(
                    `Supprimer définitivement la conversation "${conversation.title}" ?`,
                  );

                  if (!confirmed) {
                    return;
                  }

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
