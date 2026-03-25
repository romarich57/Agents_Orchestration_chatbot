import "server-only";

import { getEnv } from "@/lib/config/env";
import { buildSimExecutionPayload } from "@/server/application/sim/sim-input-mapper";
import type {
  RunWorkflowStreamInput,
  SimStreamChunk,
  SimWorkflowPort,
} from "@/server/application/sim/sim-workflow.port";
import { parseSseStream } from "@/server/infrastructure/streaming/parse-sse";
import { ApplicationError } from "@/server/shared/errors/application-error";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const extractJson = (input: string): JsonRecord | null => {
  try {
    return JSON.parse(input) as JsonRecord;
  } catch {
    return null;
  }
};

const extractStreamingChunk = (payload: JsonRecord): string | null => {
  for (const candidate of ["chunk", "delta"]) {
    const value = payload[candidate];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return isRecord(payload.data) ? extractStreamingChunk(payload.data) : null;
};

const extractTextFromValue = (value: unknown, depth = 0): string | null => {
  if (depth > 4) {
    return null;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const text = extractTextFromValue(item, depth + 1);

      if (text) {
        return text;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const key of ["content", "response", "text", "output"]) {
    const text = extractTextFromValue(value[key], depth + 1);

    if (text) {
      return text;
    }
  }

  for (const nestedValue of Object.values(value)) {
    const text = extractTextFromValue(nestedValue, depth + 1);

    if (text) {
      return text;
    }
  }

  return null;
};

const extractFinalText = (payload: JsonRecord): string | null => {
  if ("output" in payload) {
    const fromOutput = extractTextFromValue(payload.output);

    if (fromOutput) {
      return fromOutput;
    }
  }

  if (typeof payload.content === "string" && payload.content.trim().length > 0) {
    return payload.content;
  }

  return isRecord(payload.data) ? extractFinalText(payload.data) : null;
};

const isDonePayload = (payload: JsonRecord): boolean =>
  payload.event === "done" ||
  (payload.success === true && "output" in payload) ||
  (isRecord(payload.data) && isDonePayload(payload.data));

const extractErrorMessage = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  return extractErrorMessage(value.message);
};

const extractSimError = (payload: JsonRecord, eventName: string): string | null => {
  if (eventName.toLowerCase().includes("error")) {
    return (
      extractErrorMessage(payload.error) ??
      extractErrorMessage(payload.message) ??
      "Erreur Sim Studio"
    );
  }

  if (payload.success === false) {
    return (
      extractErrorMessage(payload.error) ??
      extractErrorMessage(payload.message) ??
      "Erreur Sim Studio"
    );
  }

  if (typeof payload.event === "string" && payload.event.toLowerCase().includes("error")) {
    return (
      extractErrorMessage(payload.error) ??
      extractErrorMessage(payload.message) ??
      "Erreur Sim Studio"
    );
  }

  return isRecord(payload.data) ? extractSimError(payload.data, eventName) : null;
};

export class SimRestWorkflowClient implements SimWorkflowPort {
  async *runWorkflowStream(input: RunWorkflowStreamInput): AsyncGenerator<SimStreamChunk, void, void> {
    const env = getEnv();

    if (!env.SIM_API_KEY || !input.workflowId) {
      throw new ApplicationError({
        code: "CONFIGURATION_ERROR",
        httpStatus: 500,
        message: "La configuration Sim Studio est incomplète.",
      });
    }

    const url = `${env.SIM_BASE_URL.replace(/\/$/, "")}/api/workflows/${input.workflowId}/execute`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-Key": env.SIM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildSimExecutionPayload(input)),
      signal: input.signal,
    });

    if (!response.ok || !response.body) {
      throw new ApplicationError({
        code: "UPSTREAM_ERROR",
        httpStatus: response.status || 502,
        message: "Sim Studio a retourné une erreur.",
        details: {
          status: response.status,
        },
      });
    }

    for await (const event of parseSseStream(response.body)) {
      if (event.data === "[DONE]") {
        yield { type: "done" };
        return;
      }

      const payload = extractJson(event.data);

      if (!payload) {
        continue;
      }

      const upstreamError = extractSimError(payload, event.event);

      if (upstreamError) {
        yield {
          type: "error",
          error: upstreamError,
          metadata: payload,
        };
        continue;
      }

      const delta = extractStreamingChunk(payload);

      if (delta) {
        yield {
          type: "delta",
          delta,
          blockId: typeof payload.blockId === "string" ? payload.blockId : undefined,
          providerMessageId:
            typeof payload.messageId === "string" ? payload.messageId : undefined,
          metadata: payload,
        };
        continue;
      }

      if (event.event === "done" || isDonePayload(payload)) {
        const finalText = extractFinalText(payload);

        if (finalText) {
          yield {
            type: "final",
            content: finalText,
            metadata: payload,
          };
          continue;
        }
      }

      yield {
        type: "metadata",
        metadata: payload,
      };
    }

    yield { type: "done" };
  }
}
