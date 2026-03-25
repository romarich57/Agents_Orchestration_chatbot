import { describe, expect, it } from "vitest";
import { buildConversationTitle } from "@/server/domain/conversation/conversation-title";

describe("buildConversationTitle", () => {
  it("creates a concise title from significant words", () => {
    expect(
      buildConversationTitle("Peux-tu m'aider à concevoir une architecture propre pour mon BFF ?"),
    ).toBe("Peux-tu m'aider à concevoir architecture propre mon...");
  });

  it("falls back to a default title when content is empty", () => {
    expect(buildConversationTitle("   ")).toBe("Nouvelle conversation");
  });

  it("truncates overly long generated titles", () => {
    const result = buildConversationTitle(
      "Analyse détaillée d'une stratégie de streaming temps réel pour une application conversationnelle robuste et maintenable avec backend Node et mémoire d'agent persistée",
    );

    expect(result.length).toBeLessThanOrEqual(55);
    expect(result.endsWith("...")).toBe(true);
  });
});
