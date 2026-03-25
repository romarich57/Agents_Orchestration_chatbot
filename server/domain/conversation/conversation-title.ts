import "server-only";

const STOP_WORDS = new Set([
  "le",
  "la",
  "les",
  "de",
  "des",
  "du",
  "un",
  "une",
  "et",
  "ou",
  "pour",
  "avec",
  "sur",
  "dans",
  "que",
  "qui",
]);

export const buildConversationTitle = (content: string) => {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "Nouvelle conversation";
  }

  const significantWords = normalized
    .split(" ")
    .filter((word) => !STOP_WORDS.has(word.toLowerCase()));

  const base = (significantWords.length > 0 ? significantWords : normalized.split(" "))
    .slice(0, 10)
    .join(" ");

  return base.length <= 55 ? base : `${base.slice(0, 52).trimEnd()}...`;
};
