import { NextResponse } from "next/server";
import { renameConversationSchema } from "@/lib/validations/conversation";
import { serverContainer } from "@/server/container";
import { toErrorResponse } from "@/server/shared/errors/to-error-response";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const conversation = await serverContainer.useCases.getConversation.execute(id);

    return NextResponse.json({ data: conversation });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = renameConversationSchema.parse(body);
    const conversation = await serverContainer.useCases.renameConversation.execute(
      id,
      parsed.title,
    );

    return NextResponse.json({ data: conversation });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await serverContainer.useCases.deleteConversation.execute(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
