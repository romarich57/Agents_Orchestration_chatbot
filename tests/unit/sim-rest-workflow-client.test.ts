import { beforeEach, describe, expect, it, vi } from "vitest";

const encoder = new TextEncoder();

const createSseResponse = (payload: string) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(payload));
        controller.close();
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
      },
    },
  );

describe("SimRestWorkflowClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();

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
  });

  it("parses live chunk events from Sim Studio", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createSseResponse('data: {"blockId":"resultat-uuid","chunk":"Bon"}\n\ndata: [DONE]\n\n'),
      ),
    );

    const { SimRestWorkflowClient } = await import(
      "@/server/infrastructure/sim/sim-rest-workflow-client"
    );

    const client = new SimRestWorkflowClient();
    const chunks = [];

    for await (const chunk of client.runWorkflowStream({
      workflowId: "wf_123",
      prompt: "Bonjour",
      memoryKey: "conv_1",
      files: [],
      selectedOutputs: ["resultat.content"],
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([
      {
        type: "delta",
        delta: "Bon",
        blockId: "resultat-uuid",
        providerMessageId: undefined,
        metadata: {
          blockId: "resultat-uuid",
          chunk: "Bon",
        },
      },
      {
        type: "done",
      },
    ]);
  });

  it("extracts the terminal output content from a done payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createSseResponse(
          'data: {"event":"done","success":true,"output":{"content":"Bonjour"}}\n\ndata: [DONE]\n\n',
        ),
      ),
    );

    const { SimRestWorkflowClient } = await import(
      "@/server/infrastructure/sim/sim-rest-workflow-client"
    );

    const client = new SimRestWorkflowClient();
    const chunks = [];

    for await (const chunk of client.runWorkflowStream({
      workflowId: "wf_123",
      prompt: "Bonjour",
      memoryKey: "conv_1",
      files: [],
      selectedOutputs: ["resultat.content"],
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([
      {
        type: "final",
        content: "Bonjour",
        metadata: {
          event: "done",
          success: true,
          output: {
            content: "Bonjour",
          },
        },
      },
      {
        type: "done",
      },
    ]);
  });

  it("keeps live chunks and final output distinct in a mixed stream", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createSseResponse(
          'data: {"blockId":"resultat-uuid","chunk":"Bon"}\n\ndata: {"blockId":"resultat-uuid","chunk":"jour"}\n\ndata: {"event":"done","success":true,"output":{"content":"Bonjour complet"}}\n\ndata: [DONE]\n\n',
        ),
      ),
    );

    const { SimRestWorkflowClient } = await import(
      "@/server/infrastructure/sim/sim-rest-workflow-client"
    );

    const client = new SimRestWorkflowClient();
    const chunks = [];

    for await (const chunk of client.runWorkflowStream({
      workflowId: "wf_123",
      prompt: "Bonjour",
      memoryKey: "conv_1",
      files: [],
      selectedOutputs: ["resultat.content"],
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([
      {
        type: "delta",
        delta: "Bon",
        blockId: "resultat-uuid",
        providerMessageId: undefined,
        metadata: {
          blockId: "resultat-uuid",
          chunk: "Bon",
        },
      },
      {
        type: "delta",
        delta: "jour",
        blockId: "resultat-uuid",
        providerMessageId: undefined,
        metadata: {
          blockId: "resultat-uuid",
          chunk: "jour",
        },
      },
      {
        type: "final",
        content: "Bonjour complet",
        metadata: {
          event: "done",
          success: true,
          output: {
            content: "Bonjour complet",
          },
        },
      },
      {
        type: "done",
      },
    ]);
  });

  it("maps upstream Sim Studio errors to error chunks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createSseResponse('event: error\ndata: {"message":"Workflow failed"}\n\ndata: [DONE]\n\n'),
      ),
    );

    const { SimRestWorkflowClient } = await import(
      "@/server/infrastructure/sim/sim-rest-workflow-client"
    );

    const client = new SimRestWorkflowClient();
    const chunks = [];

    for await (const chunk of client.runWorkflowStream({
      workflowId: "wf_123",
      prompt: "Bonjour",
      memoryKey: "conv_1",
      files: [],
      selectedOutputs: ["resultat.content"],
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([
      {
        type: "error",
        error: "Workflow failed",
        metadata: {
          message: "Workflow failed",
        },
      },
      {
        type: "done",
      },
    ]);
  });
});
