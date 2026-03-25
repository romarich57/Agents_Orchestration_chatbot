"use client";

import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const EmptyChatState = ({
  onCreateConversation,
}: {
  onCreateConversation: () => void;
}) => (
  <div className="flex h-full flex-col items-center justify-center px-6 text-center animate-fade-in">
    <div className="w-full max-w-md rounded-[2rem] border border-[color:var(--border-strong)] bg-[color:var(--panel-elevated)] p-8 shadow-[var(--shadow-md)]">
      <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
        <MessageSquarePlus className="size-5 opacity-80" />
      </div>
      <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-2 text-[color:var(--foreground)]">
        Démarrer une nouvelle session
      </h1>
      <p className="mx-auto mb-8 max-w-sm text-[0.9375rem] text-[color:var(--muted)]">
        Lancez une conversation pour interagir avec les modèles d'intelligence artificielle configurés pour votre environnement.
      </p>
      <Button className="w-full sm:w-auto" onClick={onCreateConversation}>
        Nouvelle conversation
      </Button>
    </div>
  </div>
);
