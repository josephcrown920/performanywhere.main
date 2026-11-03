// Browser-safe catalog of studio models shown in pickers.
// "ready" models are live on the AI gateway for this workspace. "locked" models need a
// workspace admin to enable their vendor (Connectors → AI) before they can run.
export type ModelKind = "chat" | "image" | "video";
export type StudioModel = {
  id: string;
  label: string;
  vendor: string;
  kind: ModelKind;
  status: "ready" | "locked";
  note?: string;
};

const BYTEDANCE_NOTE = "ByteDance ModelArk — a workspace admin must enable ByteDance under Connectors → AI";
const GLM_NOTE = "Zhipu GLM is not offered by the AI gateway yet";

export const STUDIO_MODELS: StudioModel[] = [
  // Chat / agent brains
  { id: "openai/gpt-6-astra", label: "GPT-6 Astra", vendor: "OpenAI", kind: "chat", status: "ready" },
  { id: "openai/gpt-6.1-sol", label: "GPT-6.1 Sol", vendor: "OpenAI", kind: "chat", status: "ready" },
  { id: "openai/gpt-6-sol", label: "GPT-6 Sol", vendor: "OpenAI", kind: "chat", status: "ready" },
  { id: "openai/gpt-6-luna", label: "GPT-6 Luna", vendor: "OpenAI", kind: "chat", status: "ready" },
  { id: "openai/gpt-5.5-pro", label: "GPT-5.5 Pro", vendor: "OpenAI", kind: "chat", status: "ready" },
  { id: "openai/gpt-5.5", label: "GPT-5.5", vendor: "OpenAI", kind: "chat", status: "ready" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", vendor: "OpenAI", kind: "chat", status: "ready" },
  { id: "bytedance/doubao-seed-pro", label: "Doubao Seed Pro", vendor: "ByteDance", kind: "chat", status: "locked", note: BYTEDANCE_NOTE },
  { id: "bytedance/doubao-seed-lite", label: "Doubao Seed Lite", vendor: "ByteDance", kind: "chat", status: "locked", note: BYTEDANCE_NOTE },
  { id: "zhipu/glm", label: "GLM", vendor: "Zhipu", kind: "chat", status: "locked", note: GLM_NOTE },

  // Image
  { id: "openai/gpt-image-2.5-sunburst", label: "GPT Image 2.5 Sunburst", vendor: "OpenAI", kind: "image", status: "ready" },
  { id: "openai/gpt-image-2.5-flare", label: "GPT Image 2.5 Flare (fast)", vendor: "OpenAI", kind: "image", status: "ready" },
  { id: "openai/gpt-image-2", label: "GPT Image 2", vendor: "OpenAI", kind: "image", status: "ready" },
  { id: "openai/gpt-image-1-mini", label: "GPT Image 1 Mini", vendor: "OpenAI", kind: "image", status: "ready" },
  { id: "bytedance/seedream", label: "Seedream", vendor: "ByteDance", kind: "image", status: "locked", note: BYTEDANCE_NOTE },

  // Video
  { id: "google/gemini-omni-1.1-flash", label: "Gemini Omni 1.1 Flash", vendor: "Google", kind: "video", status: "ready" },
  { id: "google/veo-3.1", label: "Veo 3.1", vendor: "Google", kind: "video", status: "ready" },
  { id: "google/veo-3.1-fast", label: "Veo 3.1 Fast", vendor: "Google", kind: "video", status: "ready" },
  { id: "google/veo-3.1-lite", label: "Veo 3.1 Lite", vendor: "Google", kind: "video", status: "ready" },
  { id: "bytedance/seedance", label: "Seedance", vendor: "ByteDance", kind: "video", status: "locked", note: BYTEDANCE_NOTE },
];

export const modelsOf = (kind: ModelKind) => STUDIO_MODELS.filter((m) => m.kind === kind);

export const UPSCALE_LEVELS = [
  { id: "2x", label: "2× Detail", prompt: "Upscale this frame to 2x resolution: sharpen fine detail, clean noise, keep composition, faces and colors identical." },
  { id: "4x", label: "4× Studio", prompt: "Upscale this frame to 4x studio master quality: crisp micro-detail in skin, fabric and lights, preserve film grain, keep composition, identity and colors identical." },
] as const;
