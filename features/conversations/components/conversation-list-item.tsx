"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Spinner } from "@/components/ui/spinner";
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

  return (
    <div
      className={cn(
        "group rounded-3xl border px-3 py-3 transition",
        isActive
          ? "border-[color:var(--accent)] bg-[color:var(--surface-strong)]"
          : "border-transparent hover:border-[color:var(--border)] hover:bg-white/40 dark:hover:bg-white/5",
      )}
    >
      <div className="flex items-start gap-3">
        <Link href={`/conversations/${conversation.id}`} className="min-w-0 flex-1">
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
              className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-2 py-1 text-sm outline-none"
            />
          ) : (
            <>
              <p className="truncate text-sm font-medium">{conversation.title}</p>
              <p
                className="mt-1 text-xs text-[color:var(--muted)]"
                title={formatAbsoluteDate(conversation.updatedAt)}
              >
                {mounted
                  ? formatRelativeDate(conversation.updatedAt)
                  : formatAbsoluteDate(conversation.updatedAt)}
              </p>
            </>
          )}
        </Link>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <IconButton
            aria-label="Renommer"
            className="size-8"
            onClick={() => setIsEditing(true)}
            disabled={isSaving || isDeleting}
          >
            {isSaving ? <Spinner /> : <Pencil className="size-4" />}
          </IconButton>
          <IconButton
            aria-label="Supprimer"
            className="size-8 text-[color:var(--danger)]"
            onClick={() => void onDelete()}
            disabled={isDeleting}
          >
            {isDeleting ? <Spinner /> : <Trash2 className="size-4" />}
          </IconButton>
        </div>
      </div>
    </div>
  );
};
