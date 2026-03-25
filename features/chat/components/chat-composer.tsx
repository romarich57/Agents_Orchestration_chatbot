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
    <div className="bg-[color:var(--background)] p-4 md:p-6 border-t border-[color:var(--border)]">
      <div className="max-w-3xl mx-auto w-full">
        {attachments.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-xs text-[color:var(--foreground)] shadow-sm"
              >
                <Paperclip className="size-3.5 text-[color:var(--muted-foreground)]" />
                <span className="max-w-40 truncate font-medium">{attachment.previewLabel}</span>
                <button
                  type="button"
                  className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
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

        <div className="relative flex items-end gap-2 rounded-2xl bg-[color:var(--surface)] border border-[color:var(--border)] p-2 shadow-sm focus-within:ring-1 focus-within:ring-[color:var(--accent)] focus-within:border-[color:var(--accent)] transition-all">
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

          <IconButton 
            aria-label="Ajouter un fichier" 
            onClick={() => inputRef.current?.click()}
            className="mb-0.5 ml-1 size-8 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--surface-hover)]"
          >
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
            placeholder="Message..."
            className="max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-[color:var(--muted-foreground)] text-[color:var(--foreground)]"
          />

          <Button 
            onClick={() => void submit()} 
            disabled={sendMessage.isPending || !content.trim()}
            className="mb-0.5 mr-1 rounded-xl px-3 py-2 h-8"
          >
            {sendMessage.isPending ? <Spinner className="size-3.5" /> : <Send className="size-3.5" />}
          </Button>
        </div>
        <p className="mt-2 text-center text-[0.65rem] text-[color:var(--muted-foreground)]">
          Entrée pour envoyer, Shift + Entrée pour un saut de ligne.
        </p>
      </div>
    </div>
  );
};
