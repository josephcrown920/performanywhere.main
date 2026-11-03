import { defineTool } from "@lovable.dev/mcp-js";

import { CAMERA_MOVES, STYLE_PRESETS } from "@/flow/data/demo";

export default defineTool({
  name: "list_style_presets",
  title: "List Style Presets",
  description:
    "Return the available visual style presets and the standard camera movement options FlowAurora offers.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: `Style presets: ${STYLE_PRESETS.join(", ")}. Camera moves: ${CAMERA_MOVES.join(", ")}.`,
      },
    ],
    structuredContent: {
      stylePresets: [...STYLE_PRESETS],
      cameraMoves: [...CAMERA_MOVES],
    },
  }),
});
