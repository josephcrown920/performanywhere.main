import { defineTool } from "@lovable.dev/mcp-js";

import { DEMO_PROJECT } from "@/flow/data/demo";

export default defineTool({
  name: "get_project",
  title: "Get Demo Project",
  description:
    "Return the demo project's title, logline and style preset for FlowAurora's storyboard board.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: `${DEMO_PROJECT.title} — ${DEMO_PROJECT.logline} (style: ${DEMO_PROJECT.stylePreset})`,
      },
    ],
    structuredContent: {
      project: {
        title: DEMO_PROJECT.title,
        logline: DEMO_PROJECT.logline,
        stylePreset: DEMO_PROJECT.stylePreset,
      },
    },
  }),
});
