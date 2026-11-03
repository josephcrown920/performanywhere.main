import { defineTool } from "@lovable.dev/mcp-js";

import { DEMO_PROJECT, DEMO_SHOTS } from "@/flow/data/demo";

const toShotJson = (shot: (typeof DEMO_SHOTS)[number]) => ({
  id: shot.id,
  scene: shot.scene,
  number: shot.number,
  title: shot.title,
  description: shot.description,
  camera: shot.camera,
  duration: shot.duration,
  frame: shot.frame,
  tint: shot.tint,
  status: shot.status,
});

export default defineTool({
  name: "get_shot_list",
  title: "Get Demo Shot List",
  description:
    "Return the demo project's full shot list: scene labels, shot numbers, titles, descriptions, camera movement notes and estimated durations.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: `${DEMO_SHOTS.length} shots on the "${DEMO_PROJECT.title}" board.`,
      },
    ],
    structuredContent: {
      project: DEMO_PROJECT.title,
      shots: DEMO_SHOTS.map(toShotJson),
    },
  }),
});
