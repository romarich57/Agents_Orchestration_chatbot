import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSimExecutionPayload } from "@/server/application/sim/sim-input-mapper";

describe("buildSimExecutionPayload", () => {
  beforeEach(() => {
    vi.resetModules();
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
    process.env.SIM_SELECTED_OUTPUTS = "agent1.content";
  });

  it("maps prompt, memory and files using configurable keys", () => {
    const payload = buildSimExecutionPayload({
      workflowId: "wf_123",
      prompt: "Bonjour",
      memoryKey: "conv_1",
      files: [
        {
          name: "notes.txt",
          mimeType: "text/plain",
          contentBase64: "ZmlsZQ==",
        },
      ],
      selectedOutputs: ["agent1.content"],
    });

    expect(payload).toEqual({
      input: "Bonjour",
      query: "Bonjour",
      conversationId: "conv_1",
      files: [
        {
          data: "data:text/plain;base64,ZmlsZQ==",
          type: "file",
          name: "notes.txt",
          mime: "text/plain",
        },
      ],
      stream: true,
      selectedOutputs: ["agent1.content"],
    });
  });

  it("omits selectedOutputs when no output is configured", () => {
    const payload = buildSimExecutionPayload({
      workflowId: "wf_123",
      prompt: "Bonjour",
      memoryKey: "conv_1",
      files: [],
      selectedOutputs: [],
    });

    expect(payload).toEqual({
      input: "Bonjour",
      query: "Bonjour",
      conversationId: "conv_1",
      stream: true,
    });
  });
});
