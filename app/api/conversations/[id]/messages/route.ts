import { NextResponse } from "next/server";
import { sendMessageSchema } from "@/lib/validations/message";
import { serializeSseEvent } from "@/lib/utils/sse";
import { serverContainer } from "@/server/container";
import { toErrorResponse } from "@/server/shared/errors/to-error-response";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const content = String(formData.get("content") ?? "");
    const clientRequestId = String(formData.get("clientRequestId") ?? "");
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    sendMessageSchema.parse({
      content,
      clientRequestId,
      files,
    });

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const encoder = new TextEncoder();
        const emit = async (event: Parameters<typeof serializeSseEvent>[0]) => {
          controller.enqueue(encoder.encode(serializeSseEvent(event)));
        };

        try {
          await serverContainer.useCases.sendMessageAndStreamAssistantReply.execute({
            conversationId: id,
            content,
            clientRequestId,
            files,
            signal: request.signal,
            emit,
          });
        } catch (error) {
          if (!request.signal.aborted) {
            controller.enqueue(
              encoder.encode(
                serializeSseEvent({
                  type: "assistant.failed",
                  assistantMessageId: "unknown",
                  errorCode: "INTERNAL_ERROR",
                  message:
                    error instanceof Error
                      ? error.message
                      : "La génération de réponse a échoué.",
                }),
              ),
            );
            controller.enqueue(encoder.encode(serializeSseEvent({ type: "done", ok: true })));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
