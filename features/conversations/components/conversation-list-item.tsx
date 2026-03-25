"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useMounted } from "@/lib/hooks/use-mounted";
import { formatAbsoluteDate, formatRelativeDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { ConversationSummaryDto } from "@/features/conversations/types/conversation";

type Props = {
  conversation: ConversationSummaryDto;
  isActive: boolean;
  isDeleting: boolean;
  onRename: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
};

export const ConversationListItem = ({
  conversation,
  isActive,
  isDeleting,
  onRename,
  onDelete,
}: Props) => {
  const mounted = useMounted();
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conversation.title);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const submitRename = async () => {
    const nextTitle = draftTitle.trim();

    if (!nextTitle || nextTitle === conversation.title) {
      setDraftTitle(conversation.title);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    await onRename(nextTitle);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await onDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div
        className={cn(
          "group rounded-xl px-3 py-3 transition-colors duration-200 cursor-pointer",
          isActive
            ? "bg-[color:var(--surface-strong)] shadow-sm"
            : "hover:bg-[color:var(--surface-hover)]",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <Link href={`/conversations/${conversation.id}`} className="min-w-0 flex-1 block">
            {isEditing ? (
              <input
                autoFocus
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                onBlur={submitRename}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void submitRename();
                  }

                  if (event.key === "Escape") {
                    setDraftTitle(conversation.title);
                    setIsEditing(false);
                  }
                }}
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-1 text-sm outline-none focus:border-[color:var(--accent)]"
              />
            ) : (
              <>
                <p className={cn("truncate text-sm transition-colors", isActive ? "font-semibold text-[color:var(--foreground)]" : "font-medium text-[color:var(--muted-foreground)] group-hover:text-[color:var(--foreground)]")}>
                  {conversation.title}
                </p>
                <p
                  className="mt-0.5 text-xs text-[color:var(--muted-foreground)] opacity-80"
                  title={formatAbsoluteDate(conversation.updatedAt)}
                >
                  {mounted
                    ? formatRelativeDate(conversation.updatedAt)
                    : formatAbsoluteDate(conversation.updatedAt)}
                </p>
              </>
            )}
          </Link>
          <div className={cn("flex items-center gap-1 transition-opacity duration-200", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
            <IconButton
              aria-label="Renommer"
              className="size-7 hover:bg-[color:var(--border)] hover:text-[color:var(--foreground)] text-[color:var(--muted)]"
              onClick={(e) => {
                e.preventDefault();
                setIsEditing(true);
              }}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? <Spinner /> : <Pencil className="size-3.5" />}
            </IconButton>
            <IconButton
              aria-label="Supprimer"
              className="size-7 hover:bg-[color:var(--danger-foreground)] hover:text-[color:var(--danger)] text-[color:var(--muted)]"
              onClick={(e) => {
                e.preventDefault();
                setShowDeleteConfirm(true);
              }}
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner /> : <Trash2 className="size-3.5" />}
            </IconButton>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Supprimer cette conversation ?"
        description="Cette action est définitive. Le contenu de cette conversation sera perdu."
        confirmLabel="Supprimer"
        onConfirm={() => void handleDelete()}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
    </>
  );
};
