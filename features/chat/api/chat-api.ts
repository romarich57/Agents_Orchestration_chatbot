import type { ChatStreamEvent } from "@/features/chat/types/chat";

const readSseEvents = async (
  response: Response,
  onEvent: (event: ChatStreamEvent) => void,
) => {
  if (!response.body) {
    throw new Error("Le serveur n'a pas retourné de flux.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    let separatorIndex = buffer.indexOf("\n\n");

    while (separatorIndex !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex).trim();
      buffer = buffer.slice(separatorIndex + 2);
      separatorIndex = buffer.indexOf("\n\n");

      if (!rawEvent) {
        continue;
      }

      const dataLine = rawEvent
        .split("\n")
        .find((line) => line.startsWith("data:"));

      if (!dataLine) {
        continue;
      }

      const event = JSON.parse(dataLine.slice(5).trim()) as ChatStreamEvent;
      onEvent(event);
    }
  }
};

export const streamConversationMessage = async (params: {
  conversationId: string;
  content: string;
  clientRequestId: string;
  files: File[];
  onEvent: (event: ChatStreamEvent) => void;
}) => {
  const formData = new FormData();
  formData.set("content", params.content);
  formData.set("clientRequestId", params.clientRequestId);

  params.files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch(`/api/conversations/${params.conversationId}/messages`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;

    throw new Error(errorBody?.error?.message || "L'envoi du message a échoué.");
  }

  await readSseEvents(response, params.onEvent);
};
