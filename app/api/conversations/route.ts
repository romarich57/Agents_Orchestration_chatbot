import { NextResponse } from "next/server";
import { createConversationSchema } from "@/lib/validations/conversation";
import { serverContainer } from "@/server/container";
import { toErrorResponse } from "@/server/shared/errors/to-error-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const conversations = await serverContainer.useCases.listConversations.execute();

    return NextResponse.json({ data: conversations });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = createConversationSchema.parse(body);
    const conversation = await serverContainer.useCases.createConversation.execute(parsed.title);

    return NextResponse.json({ data: conversation }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
