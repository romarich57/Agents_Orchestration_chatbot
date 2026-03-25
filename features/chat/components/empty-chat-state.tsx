"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const EmptyChatState = ({
  onCreateConversation,
}: {
  onCreateConversation: () => void;
}) => (
  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
    <div className="glass-panel max-w-2xl rounded-[2rem] border border-[color:var(--border)] px-8 py-10">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-white">
        <Sparkles className="size-6" />
      </div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
        Un cockpit conversationnel prêt pour Sim Studio
      </h1>
      <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
        Crée une conversation, envoie un prompt et observe la réponse arriver en temps
        réel. Les titres, messages, pièces jointes et statuts restent persistés dans ton
        backend.
      </p>
      <Button className="mt-8" onClick={onCreateConversation}>
        Démarrer une conversation
      </Button>
    </div>
  </div>
);
