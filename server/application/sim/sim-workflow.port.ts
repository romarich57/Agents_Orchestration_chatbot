import "server-only";

export type SimFileInput = {
  name: string;
  mimeType: string;
  contentBase64: string;
};

export type RunWorkflowStreamInput = {
  workflowId: string;
  prompt: string;
  memoryKey: string;
  files: SimFileInput[];
  selectedOutputs: string[];
  signal?: AbortSignal;
};

export type SimStreamChunk =
  | {
      type: "delta";
      delta: string;
      blockId?: string;
      providerMessageId?: string;
      metadata?: Record<string, unknown>;
    }
  | {
      type: "final";
      content: string;
      metadata?: Record<string, unknown>;
    }
  | {
      type: "metadata";
      metadata?: Record<string, unknown>;
    }
  | {
      type: "error";
      error?: string;
      metadata?: Record<string, unknown>;
    }
  | {
      type: "done";
    };

export interface SimWorkflowPort {
  runWorkflowStream(input: RunWorkflowStreamInput): AsyncGenerator<SimStreamChunk, void, void>;
}
