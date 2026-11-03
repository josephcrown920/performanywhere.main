// Server-only helpers for the Flowaurora canvas agent (system prompt + server tools).
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

import { createLovableAiGatewayRunIdFetch } from "@/flow/lib/ai/run-id";
import { getCatalog } from "@/flow/lib/gateway-catalog.server";

import type { UIMessage } from "ai";
import type { z } from "zod";

export const AGENT_MODEL = "openai/gpt-6-astra";
const GATEWAY_BASE_URL = "https://ai.gateway.lovable.dev/v1";

export type AgentGraphContext = {
  project: { title: string; logline: string; stylePreset: string };
  nodes: {
    id: string;
    kind: string;
    title: string;
    subtitle: string;
    prompt?: string;
    lock?: string[];
    hasImage: boolean;
  }[];
  links: { id: string; from: string; to: string }[];
  characters: { id: string; name: string; role: string; description: string; tags: string[] }[];
};

export function buildSystemPrompt(context: AgentGraphContext): string {
  const characterLines = context.characters
    .map((c) => `- ${c.id} — ${c.name} (${c.role}). ${c.description} Tags: ${c.tags.join(", ")}`)
    .join("\n");
  const nodeLines = context.nodes
    .map((n) => {
      const parts = [`id=${n.id}`, `kind=${n.kind}`, `title="${n.title}"`];
      if (n.subtitle) parts.push(`subtitle="${n.subtitle}"`);
      if (n.prompt) parts.push(`prompt="${n.prompt}"`);
      if (n.lock?.length) parts.push(`lock=[${n.lock.join(", ")}]`);
      parts.push(n.hasImage ? "image=yes" : "image=no");
      return `- ${parts.join(" · ")}`;
    })
    .join("\n");
  const linkLines = context.links.map((l) => `- ${l.id}: ${l.from} → ${l.to}`).join("\n");

  return [
    "You are Flowaurora's Studio Agent — an autonomous cinematic director operating on a node-based generation canvas.",
    `Project: ${context.project.title}. Logline: ${context.project.logline}. Style preset: ${context.project.stylePreset}.`,
    "",
    "CANVAS GRAPH (live state, client-side):",
    "Nodes:",
    nodeLines || "(empty)",
    "Links:",
    linkLines || "(none)",
    "",
    "Character library (reference portraits, consistency tags):",
    characterLines || "(empty)",
    "",
    "TOOLS YOU CALL, AND ONLY THESE:",
    "- Canvas edits are client tools executed in the user's browser: add_node, delete_node, set_node, connect_nodes, cut_link, lock_character, generate_image_node, generate_locked_image.",
    "- Server tools you can also call: optimize_prompt (rewrites a rough idea into a strong cinematic generation prompt), list_models (lists available image/video/chat models).",
    "",
    "RULES:",
    "1. Every canvas change must go through a tool call. Never describe a change as done without calling the tool.",
    "2. When a node has locked characters, you MUST use generate_locked_image for it — never generate_image_node — so the reference portraits keep faces consistent. Weave each locked character's wardrobe, lighting and identity traits from the library into the prompt, and never alter their identity.",
    "3. For any character that appears in a shot you generate, lock them onto the node first with lock_character, then generate.",
    "4. Generation prompts must be vivid, self-contained cinematic prompts: subject, action, environment, lighting, lens/camera feel, and the style preset's mood. Mention the project style.",
    "5. When the user gives a full brief or story idea, work end to end without asking questions: add a script node with the logline, add shot nodes with scene numbers in titles, connect script to shots, connect shots to characters, lock characters, and generate images. Use 'SC <n>' plus shot number in shot titles, e.g. 'SC 01 / 1 — Rooftop Reveal'.",
    "6. When the user asks for models, call list_models and summarize the relevant group; do not invent model names.",
    "7. Node ids for links: pass exact ids from the graph above; for a node you just added via add_node, its tool output confirms the new id.",
    "8. Keep replies short and production-minded. After a batch of tool calls, summarize what is now on the canvas in one or two sentences.",
  ].join("\n");
}

export async function optimizePrompt(idea: string, style: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    return `Cinematic still, ${style}: ${idea}. Dramatic prismatic lighting, atmospheric haze, shallow depth of field, anamorphic lens flare, film grain.`;
  }
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: GATEWAY_BASE_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses(AGENT_MODEL),
    system: [
      "You rewrite rough ideas into single-paragraph cinematic image-generation prompts.",
      "Output ONLY the prompt text: subject, action, environment, lighting, lens and atmosphere.",
      `Style preset for mood: ${style}. Never mention the preset name. Keep it under 90 words.`,
    ].join(" "),
    prompt: `IDEA:\n${idea}`,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  const text = await result.text;
  return text.trim() || `Cinematic still, ${style}: ${idea}.`;
}

export type ModalityFilter = z.infer<typeof modalityFilterSchema>;
export const modalityFilterSchema = undefined as never; // replaced below

export async function listGatewayModels(modality?: "image" | "video" | "chat"): Promise<string> {
  const catalog = await getCatalog();
  if (catalog.models.length === 0) return "The model catalog is unavailable right now.";
  const match = (m: { input: string[]; output: string[] }) =>
    !modality ||
    (modality === "image" && m.output.includes("image")) ||
    (modality === "video" && m.output.includes("video")) ||
    (modality === "chat" && m.output.includes("text"));
  const lines = catalog.models
    .filter(match)
    .map((m) => `${m.id} — in: ${m.input.join("+") || "text"} · out: ${m.output.join("+") || "text"}`);
  return lines.length === 0 ? "No models matched that modality." : lines.join("\n");
}

export function toAgentModelMessages(messages: UIMessage[]) {
  return messages;
}
