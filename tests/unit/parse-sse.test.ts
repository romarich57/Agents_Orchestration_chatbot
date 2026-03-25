import { describe, expect, it } from "vitest";
import { parseSseStream } from "@/server/infrastructure/streaming/parse-sse";

const encoder = new TextEncoder();

const createStream = (payload: string) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(payload));
      controller.close();
    },
  });

describe("parseSseStream", () => {
  it("parses multiple SSE events from a stream", async () => {
    const stream = createStream(
      "event: assistant.delta\ndata: {\"delta\":\"Bon\"}\n\nevent: done\ndata: [DONE]\n\n",
    );

    const events = [];

    for await (const event of parseSseStream(stream)) {
      events.push(event);
    }

    expect(events).toEqual([
      {
        event: "assistant.delta",
        data: "{\"delta\":\"Bon\"}",
      },
      {
        event: "done",
        data: "[DONE]",
      },
    ]);
  });

  it("supports CRLF separated SSE events", async () => {
    const stream = createStream(
      "data: {\"chunk\":\"Bon\"}\r\n\r\ndata: {\"event\":\"done\",\"output\":{\"content\":\"Bonjour\"}}\r\n\r\n",
    );

    const events = [];

    for await (const event of parseSseStream(stream)) {
      events.push(event);
    }

    expect(events).toEqual([
      {
        event: "message",
        data: "{\"chunk\":\"Bon\"}",
      },
      {
        event: "message",
        data: "{\"event\":\"done\",\"output\":{\"content\":\"Bonjour\"}}",
      },
    ]);
  });
});
