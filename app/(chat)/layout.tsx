import { serverContainer } from "@/server/container";
import { ChatShell } from "@/features/chat/components/chat-shell";

export const dynamic = "force-dynamic";

export default async function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const conversations = await serverContainer.useCases.listConversations.execute();

  return <ChatShell initialConversations={conversations}>{children}</ChatShell>;
}
