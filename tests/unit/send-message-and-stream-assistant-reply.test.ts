import { beforeEach, describe, expect, it, vi } from "vitest";

const txSpies = vi.hoisted(() => ({
  createUserMessage: vi.fn(),
  createAssistantMessage: vi.fn(),
  updateStatus: vi.fn(),
}));

vi.mock("@/server/infrastructure/db/transaction", () => ({
  withTransaction: async (callback: (transaction: object) => Promise<unknown>) => callback({}),
}));

vi.mock("@/server/infrastructure/repositories/prisma-message-repository", async () => {
  const actual = await vi.importActual<object>(
    "@/server/infrastructure/repositories/prisma-message-repository",
  );

  return {
    ...actual,
    PrismaMessageRepository: class PrismaMessageRepository {
      createUserMessage(...args: unknown[]) {
        return txSpies.createUserMessage(...args);
      }

      createAssistantMessage(...args: unknown[]) {
        return txSpies.createAssistantMessage(...args);
      }
    },
  };
});

vi.mock("@/server/infrastructure/repositories/prisma-conversation-repository", async () => {
  const actual = await vi.importActual<object>(
    "@/server/infrastructure/repositories/prisma-conversation-repository",
  );

  return {
    ...actual,
    PrismaConversationRepository: class PrismaConversationRepository {
      updateStatus(...args: unknown[]) {
        return txSpies.updateStatus(...args);
      }
    },
  };
});

describe("SendMessageAndStreamAssistantReplyUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgresql://example";
    process.env.APP_BASE_URL = "http://localhost:3000";
    process.env.UPLOAD_DIR = "./uploads";
    process.env.MAX_FILE_SIZE_MB = "10";
    process.env.MAX_ATTACHMENTS_PER_MESSAGE = "5";
    process.env.ALLOWED_UPLOAD_MIME_TYPES = "application/pdf,text/plain";
    process.env.SIM_API_KEY = "test";
    process.env.SIM_BASE_URL = "https://www.sim.ai";
    process.env.SIM_WORKFLOW_ID = "wf_123";
    process.env.SIM_PROMPT_INPUT_KEY = "input";
    process.env.SIM_QUERY_INPUT_KEY = "query";
    process.env.SIM_MEMORY_INPUT_KEY = "conversationId";
    process.env.SIM_FILES_INPUT_KEY = "files";
    process.env.SIM_SELECTED_OUTPUTS = "resultat.content";

    txSpies.createUserMessage.mockResolvedValue({
      id: "user_1",
      attachments: [],
    });
    txSpies.createAssistantMessage.mockResolvedValue({
      id: "assistant_1",
      attachments: [],
    });
    txSpies.updateStatus.mockResolvedValue({
      id: "conv_1",
      title: "Nouvelle conversation",
      status: "streaming",
      updatedAt: "2026-03-25T10:00:00.000Z",
      createdAt: "2026-03-25T10:00:00.000Z",
    });
  });

  it("finalizes the assistant message from the terminal output when no delta was streamed", async () => {
    const { SendMessageAndStreamAssistantReplyUseCase } = await import(
      "@/server/application/messages/send-message-and-stream-assistant-reply"
    );

    const conversationRepository = {
      findEntity: vi.fn().mockResolvedValue({
        id: "conv_1",
        title: "Nouvelle conversation",
        titleManuallyEdited: false,
        simMemoryKey: "mem_1",
      }),
      updateGeneratedTitle: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi
        .fn()
        .mockResolvedValueOnce({
          id: "conv_1",
          title: "Nouvelle conversation",
          status: "idle",
          updatedAt: "2026-03-25T10:00:01.000Z",
        })
        .mockResolvedValue({
          id: "conv_1",
          title: "Qu est ce qu une classe en Java",
          status: "idle",
          updatedAt: "2026-03-25T10:00:01.000Z",
        }),
    };
    const messageRepository = {
      findByClientRequestId: vi.fn().mockResolvedValue(null),
      findAssistantForUserMessageId: vi.fn().mockResolvedValue(null),
      updateAssistantStreaming: vi.fn(),
      completeAssistantMessage: vi.fn().mockResolvedValue({
        id: "assistant_1",
        content: "Bonjour final",
        metadata: { chunkCount: 0, usedFinalOutputFallback: true },
      }),
      failAssistantMessage: vi.fn(),
    };
    const eventLogRepository = {
      create: vi.fn().mockResolvedValue(undefined),
    };
    const storage = {
      store: vi.fn().mockResolvedValue([]),
    };
    const simWorkflow = {
      async *runWorkflowStream() {
        yield {
          type: "final" as const,
          content: "Bonjour final",
          metadata: { event: "done", output: { content: "Bonjour final" } },
        };
        yield { type: "done" as const };
      },
    };

    const events: Array<Record<string, unknown>> = [];
    const useCase = new SendMessageAndStreamAssistantReplyUseCase(
      conversationRepository as never,
      messageRepository as never,
      eventLogRepository as never,
      storage as never,
      simWorkflow,
    );

    await useCase.execute({
      conversationId: "conv_1",
      content: "Bonjour",
      clientRequestId: "req_1",
      files: [],
      emit: (event) => {
        events.push(event as unknown as Record<string, unknown>);
      },
    });

    expect(messageRepository.updateAssistantStreaming).not.toHaveBeenCalled();
    expect(messageRepository.completeAssistantMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Bonjour final",
        metadata: expect.objectContaining({
          chunkCount: 0,
          usedFinalOutputFallback: true,
          hadTerminalOutput: true,
          simSelectedOutputs: ["resultat.content"],
        }),
      }),
    );
    expect(eventLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "message.stream.completed",
        payload: expect.objectContaining({
          chunkCount: 0,
          usedFinalOutputFallback: true,
          hadTerminalOutput: true,
          simSelectedOutputs: ["resultat.content"],
        }),
      }),
    );
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "assistant.completed",
          content: "Bonjour final",
        }),
      ]),
    );
  });

  it("keeps streamed deltas and replaces them with the terminal output when provided", async () => {
    const { SendMessageAndStreamAssistantReplyUseCase } = await import(
      "@/server/application/messages/send-message-and-stream-assistant-reply"
    );

    const conversationRepository = {
      findEntity: vi.fn().mockResolvedValue({
        id: "conv_1",
        title: "Nouvelle conversation",
        titleManuallyEdited: false,
        simMemoryKey: "mem_1",
      }),
      updateGeneratedTitle: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi.fn().mockResolvedValue({
        id: "conv_1",
        title: "Nouvelle conversation",
        status: "idle",
        updatedAt: "2026-03-25T10:00:01.000Z",
      }),
    };
    const messageRepository = {
      findByClientRequestId: vi.fn().mockResolvedValue(null),
      findAssistantForUserMessageId: vi.fn().mockResolvedValue(null),
      updateAssistantStreaming: vi.fn(),
      completeAssistantMessage: vi.fn().mockResolvedValue({
        id: "assistant_1",
        content: "Bonjour complet",
        metadata: { chunkCount: 2, usedFinalOutputFallback: false },
      }),
      failAssistantMessage: vi.fn(),
    };
    const eventLogRepository = {
      create: vi.fn().mockResolvedValue(undefined),
    };
    const storage = {
      store: vi.fn().mockResolvedValue([]),
    };
    const simWorkflow = {
      async *runWorkflowStream() {
        yield {
          type: "delta" as const,
          delta: "Bon",
          metadata: { blockId: "resultat-uuid", chunk: "Bon" },
        };
        yield {
          type: "delta" as const,
          delta: "jour",
          metadata: { blockId: "resultat-uuid", chunk: "jour" },
        };
        yield {
          type: "final" as const,
          content: "Bonjour complet",
          metadata: { event: "done", output: { content: "Bonjour complet" } },
        };
        yield { type: "done" as const };
      },
    };

    const useCase = new SendMessageAndStreamAssistantReplyUseCase(
      conversationRepository as never,
      messageRepository as never,
      eventLogRepository as never,
      storage as never,
      simWorkflow,
    );

    await useCase.execute({
      conversationId: "conv_1",
      content: "Bonjour",
      clientRequestId: "req_1",
      files: [],
      emit: vi.fn(),
    });

    expect(messageRepository.updateAssistantStreaming).toHaveBeenNthCalledWith(
      1,
      "assistant_1",
      "Bon",
      "streaming",
    );
    expect(messageRepository.updateAssistantStreaming).toHaveBeenNthCalledWith(
      2,
      "assistant_1",
      "Bonjour",
      "streaming",
    );
    expect(messageRepository.completeAssistantMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Bonjour complet",
        metadata: expect.objectContaining({
          chunkCount: 2,
          usedFinalOutputFallback: false,
          hadTerminalOutput: true,
        }),
      }),
    );
  });

  it("fails the assistant message when Sim returns no exploitable text", async () => {
    const { SendMessageAndStreamAssistantReplyUseCase } = await import(
      "@/server/application/messages/send-message-and-stream-assistant-reply"
    );

    const conversationRepository = {
      findEntity: vi.fn().mockResolvedValue({
        id: "conv_1",
        title: "Nouvelle conversation",
        titleManuallyEdited: false,
        simMemoryKey: "mem_1",
      }),
      updateGeneratedTitle: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi.fn().mockResolvedValue({
        id: "conv_1",
        title: "Nouvelle conversation",
        status: "error",
        updatedAt: "2026-03-25T10:00:01.000Z",
      }),
    };
    const messageRepository = {
      findByClientRequestId: vi.fn().mockResolvedValue(null),
      findAssistantForUserMessageId: vi.fn().mockResolvedValue(null),
      updateAssistantStreaming: vi.fn(),
      completeAssistantMessage: vi.fn(),
      failAssistantMessage: vi.fn().mockResolvedValue({
        id: "assistant_1",
      }),
    };
    const eventLogRepository = {
      create: vi.fn().mockResolvedValue(undefined),
    };
    const storage = {
      store: vi.fn().mockResolvedValue([]),
    };
    const simWorkflow = {
      async *runWorkflowStream() {
        yield { type: "metadata" as const, metadata: { event: "done", output: {} } };
        yield { type: "done" as const };
      },
    };
    const emitted: Array<Record<string, unknown>> = [];

    const useCase = new SendMessageAndStreamAssistantReplyUseCase(
      conversationRepository as never,
      messageRepository as never,
      eventLogRepository as never,
      storage as never,
      simWorkflow,
    );

    await useCase.execute({
      conversationId: "conv_1",
      content: "Bonjour",
      clientRequestId: "req_1",
      files: [],
      emit: (event) => {
        emitted.push(event as unknown as Record<string, unknown>);
      },
    });

    expect(messageRepository.completeAssistantMessage).not.toHaveBeenCalled();
    expect(messageRepository.failAssistantMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Le workflow Sim n'a renvoyé aucun contenu textuel exploitable.",
      }),
    );
    expect(eventLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "message.stream.failed",
        payload: expect.objectContaining({
          error: "Le workflow Sim n'a renvoyé aucun contenu textuel exploitable.",
          chunkCount: 0,
        }),
      }),
    );
    expect(emitted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "assistant.failed",
          errorCode: "UPSTREAM_EMPTY_RESPONSE",
        }),
      ]),
    );
  });
});
