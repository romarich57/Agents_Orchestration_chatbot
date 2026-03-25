import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MessageBubble } from "@/features/chat/components/message-bubble";
import type { MessageDto } from "@/features/chat/types/chat";

const createMessage = (overrides: Partial<MessageDto>): MessageDto => ({
  id: "msg_1",
  conversationId: "conv_1",
  role: "assistant",
  content: "",
  status: "streaming",
  clientRequestId: null,
  providerMessageId: null,
  error: null,
  metadata: null,
  createdAt: "2026-03-25T10:00:00.000Z",
  updatedAt: "2026-03-25T10:00:00.000Z",
  attachments: [],
  ...overrides,
});

describe("MessageBubble", () => {
  it("shows the thinking state only while the assistant is pending or streaming", () => {
    const html = renderToStaticMarkup(
      <MessageBubble message={createMessage({ status: "streaming", content: "" })} />,
    );

    expect(html).toContain("L&#x27;agent réfléchit");
  });

  it("shows an explicit empty response state for completed assistant messages", () => {
    const html = renderToStaticMarkup(
      <MessageBubble message={createMessage({ status: "completed", content: "" })} />,
    );

    expect(html).toContain("Réponse vide du workflow.");
    expect(html).not.toContain("L&#x27;agent réfléchit");
  });

  it("shows the failure message instead of the thinking state when the assistant failed", () => {
    const html = renderToStaticMarkup(
      <MessageBubble
        message={createMessage({
          status: "failed",
          content: "",
          error: "Le workflow Sim n'a renvoyé aucun contenu textuel exploitable.",
        })}
      />,
    );

    expect(html).toContain("Le workflow Sim n&#x27;a renvoyé aucun contenu textuel exploitable.");
    expect(html).not.toContain("L&#x27;agent réfléchit");
  });
});
