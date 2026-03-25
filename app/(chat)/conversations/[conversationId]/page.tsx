import { notFound } from "next/navigation";
import { ConversationWorkspace } from "@/features/chat/components/conversation-workspace";
import { serverContainer } from "@/server/container";
import { ApplicationError } from "@/server/shared/errors/application-error";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export default async function ConversationPage(context: RouteContext) {
  const { conversationId } = await context.params;

  try {
    const conversation = await serverContainer.useCases.getConversation.execute(conversationId);

    return (
      <ConversationWorkspace
        conversationId={conversationId}
        initialConversation={conversation}
      />
    );
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }
}
