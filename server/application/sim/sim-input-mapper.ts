import "server-only";

import { getEnv } from "@/lib/config/env";
import type { RunWorkflowStreamInput } from "@/server/application/sim/sim-workflow.port";

export const buildSimExecutionPayload = (input: RunWorkflowStreamInput) => {
  const env = getEnv();

  return {
    [env.SIM_PROMPT_INPUT_KEY]: input.prompt,
    [env.SIM_QUERY_INPUT_KEY]: input.prompt,
    [env.SIM_MEMORY_INPUT_KEY]: input.memoryKey,
    ...(input.files.length > 0
      ? {
          [env.SIM_FILES_INPUT_KEY]: input.files.map((file) => ({
            data: `data:${file.mimeType};base64,${file.contentBase64}`,
            type: "file",
            name: file.name,
            mime: file.mimeType,
          })),
        }
      : {}),
    stream: true,
    ...(input.selectedOutputs.length > 0
      ? {
          selectedOutputs: input.selectedOutputs,
        }
      : {}),
  };
};
