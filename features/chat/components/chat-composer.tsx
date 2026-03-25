"use client";

import { useRef, useState } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Spinner } from "@/components/ui/spinner";
import type { PendingAttachment } from "@/features/attachments/types/attachment";
import { useSendMessage } from "@/features/chat/hooks/use-send-message";

export const ChatComposer = ({ conversationId }: { conversationId: string }) => {
  const sendMessage = useSendMessage(conversationId);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);

  const resetComposer = () => {
    setContent("");
    setAttachments([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const submit = async () => {
    if (!content.trim() || sendMessage.isPending) {
      return;
    }

    await sendMessage.mutateAsync({
      content,
      files: attachments.map((attachment) => attachment.file),
    });

    resetComposer();
  };

  return (
    <div className="border-t border-[color:var(--border)] px-4 py-4 md:px-8">
      {attachments.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/50 px-3 py-1.5 text-xs dark:bg-white/5"
            >
              <Paperclip className="size-3.5" />
              <span className="max-w-40 truncate">{attachment.previewLabel}</span>
              <button
                type="button"
                onClick={() =>
                  setAttachments((current) =>
                    current.filter((item) => item.id !== attachment.id),
                  )
                }
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="surface-panel flex items-end gap-3 rounded-[1.75rem] p-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            const selectedFiles = Array.from(event.target.files ?? []).map((file) => ({
              id: `${file.name}-${file.size}-${file.lastModified}`,
              file,
              previewLabel: file.name,
            }));

            setAttachments((current) => {
              const next = [...current];

              for (const file of selectedFiles) {
                if (!next.some((item) => item.id === file.id)) {
                  next.push(file);
                }
              }

              return next;
            });
          }}
        />

        <IconButton aria-label="Ajouter un fichier" onClick={() => inputRef.current?.click()}>
          <Paperclip className="size-4" />
        </IconButton>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          rows={1}
          placeholder="Écris un message à ton workflow Sim Studio..."
          className="max-h-40 min-h-[3rem] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[color:var(--muted)]"
        />

        <Button onClick={() => void submit()} disabled={sendMessage.isPending || !content.trim()}>
          {sendMessage.isPending ? <Spinner /> : <Send className="size-4" />}
          Envoyer
        </Button>
      </div>
      <p className="mt-2 text-xs text-[color:var(--muted)]">
        Entrée pour envoyer, Shift + Entrée pour une nouvelle ligne.
      </p>
    </div>
  );
};
