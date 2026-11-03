import { defineMcp } from "@lovable.dev/mcp-js";
import getCharactersTool from "@/flow/lib/mcp/tools/get-characters";
import getProjectTool from "@/flow/lib/mcp/tools/get-project";
import getShotListTool from "@/flow/lib/mcp/tools/get-shot-list";
import listStylePresetsTool from "@/flow/lib/mcp/tools/list-style-presets";

export default defineMcp({
  name: "flowaurora",
  title: "FlowAurora",
  version: "0.1.0",
  instructions:
    "Tools for FlowAurora, a cinematic storyboard studio. Use `get_project` for the demo project's logline and style preset, `get_shot_list` for its shots with camera notes, `get_characters` for the casting library, and `list_style_presets` for the available visual presets and camera moves. All tools read the built-in demo project and are read-only.",
  tools: [getProjectTool, getShotListTool, getCharactersTool, listStylePresetsTool],
});
