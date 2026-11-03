import { defineTool } from "@lovable.dev/mcp-js";

import { DEMO_CHARACTERS } from "@/flow/data/demo";

const toCharacterJson = (character: (typeof DEMO_CHARACTERS)[number]) => ({
  id: character.id,
  name: character.name,
  role: character.role,
  description: character.description,
  tags: character.tags,
  portrait: character.portrait,
  tint: character.tint,
});

export default defineTool({
  name: "get_characters",
  title: "Get Demo Characters",
  description:
    "Return the demo casting library: each character's name, role, visual description and consistency tags.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: DEMO_CHARACTERS.map((c) => `${c.name} — ${c.role}`).join("; "),
      },
    ],
    structuredContent: {
      characters: DEMO_CHARACTERS.map(toCharacterJson),
    },
  }),
});
