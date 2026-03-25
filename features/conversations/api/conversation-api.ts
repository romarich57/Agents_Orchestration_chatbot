import type {
  ConversationDetailDto,
  ConversationSummaryDto,
} from "@/features/conversations/types/conversation";

type JsonEnvelope<T> = {
  data: T;
};

const ensureOk = async (response: Response) => {
  if (response.ok) {
    return response;
  }

  const errorBody = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;

  throw new Error(errorBody?.error?.message || "La requête a échoué.");
};

export const fetchConversations = async (): Promise<ConversationSummaryDto[]> => {
  const response = await ensureOk(await fetch("/api/conversations"));
  const payload = (await response.json()) as JsonEnvelope<ConversationSummaryDto[]>;

  return payload.data;
};

export const fetchConversation = async (id: string): Promise<ConversationDetailDto> => {
  const response = await ensureOk(await fetch(`/api/conversations/${id}`));
  const payload = (await response.json()) as JsonEnvelope<ConversationDetailDto>;

  return payload.data;
};

export const createConversation = async (title?: string) => {
  const response = await ensureOk(
    await fetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(title ? { title } : {}),
    }),
  );

  const payload = (await response.json()) as JsonEnvelope<ConversationSummaryDto>;

  return payload.data;
};

export const renameConversation = async (id: string, title: string) => {
  const response = await ensureOk(
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    }),
  );

  const payload = (await response.json()) as JsonEnvelope<ConversationSummaryDto>;

  return payload.data;
};

export const deleteConversation = async (id: string) => {
  await ensureOk(
    await fetch(`/api/conversations/${id}`, {
      method: "DELETE",
    }),
  );
};
