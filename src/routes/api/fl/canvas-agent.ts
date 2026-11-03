import { createFileRoute } from '@tanstack/react-router'
import { convertToModelMessages, createUIMessageStreamResponse, stepCountIs, streamText, toUIMessageStream } from "ai";
import type { UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

import { createLovableAiGatewayRunIdFetch } from "@/flow/lib/ai/run-id";
import {
  AGENT_MODEL,
  buildSystemPrompt,
  listGatewayModels,
  optimizePrompt,
} from "@/flow/lib/canvas-agent.server";
import { isKnownModel } from "@/flow/lib/gateway-catalog.server";

export const Route = createFileRoute("/api/fl/canvas-agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        try {
          const body = (await request.json()) as {
            messages?: UIMessage[];
            context?: unknown;
            chatModel?: string;
          };
          const messages = body.messages ?? [];
          if (messages.length === 0) return new Response("No messages provided", { status: 400 });

          const context = buildSystemPrompt((body.context ?? {}) as never);

          const runIdFetch = createLovableAiGatewayRunIdFetch();
          const provider = createOpenAI({
            baseURL: "https://ai.gateway.lovable.dev/v1",
            apiKey,
            headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
            fetch: runIdFetch.fetch,
          });

          const requestedModel = body.chatModel?.trim();
          if (requestedModel && !(await isKnownModel(requestedModel))) {
            return new Response(`Model ${requestedModel} is not in the available model list`, { status: 400 });
          }

          const result = streamText({
            model: provider.responses(requestedModel || AGENT_MODEL),
            system: context,
            messages: await convertToModelMessages(messages),
            stopWhen: stepCountIs(50),
            tools: {
              optimize_prompt: {
                description:
                  "Rewrite a rough idea into a strong, self-contained cinematic image-generation prompt. Use it when the user's prompt is vague or before generating an image for a brief.",
                inputSchema: z.object({
                  idea: z.string().describe("The rough idea or scene description to sharpen"),
                  style: z.string().describe("The project's style preset, e.g. Prismatic Noir"),
                }),
                execute: async ({ idea, style }) => ({ prompt: await optimizePrompt(idea, style) }),
              },
              list_models: {
                description:
                  "List the image, video or chat models currently available through the gateway. Call when the user asks what models exist.",
                inputSchema: z.object({
                  modality: z.enum(["image", "video", "chat"]).optional(),
                }),
                execute: async ({ modality }) => ({ models: await listGatewayModels(modality) }),
              },
              // Client-side canvas tools — executed in the user's browser via onToolCall.
              add_node: {
                description:
                  "Add a node to the canvas. Kinds: script, shot, character, image. The client places it in a free slot.",
                inputSchema: z.object({
                  kind: z.enum(["script", "shot", "character", "image"]),
                  title: z.string().describe("Node title; shots use 'SC <n> / <shot> — Title'"),
                  subtitle: z.string().describe("Short subtitle, e.g. camera move and duration for shots"),
                }),
              },
              delete_node: {
                description: "Delete a node and its links from the canvas.",
                inputSchema: z.object({ nodeId: z.string().describe("Exact node id from the graph") }),
              },
              set_node: {
                description: "Update a node's title, subtitle or image prompt.",
                inputSchema: z.object({
                  nodeId: z.string(),
                  title: z.string().optional(),
                  subtitle: z.string().optional(),
                  prompt: z.string().optional().describe("Image generation prompt stored on the node"),
                }),
              },
              connect_nodes: {
                description: "Wire a link from one node's output port to another node.",
                inputSchema: z.object({ fromId: z.string(), toId: z.string() }),
              },
              cut_link: {
                description: "Remove a link by its id.",
                inputSchema: z.object({ linkId: z.string() }),
              },
              lock_character: {
                description:
                  "Lock characters onto an image or shot node so every generated frame keeps their faces consistent. Use before generating when characters appear.",
                inputSchema: z.object({
                  nodeId: z.string(),
                  characterIds: z.array(z.string()).describe("Character ids from the library"),
                }),
              },
              generate_image_node: {
                description:
                  "Generate an image into a node from a prompt. Only for nodes WITHOUT locked characters; if the node has a lock, use generate_locked_image instead.",
                inputSchema: z.object({
                  nodeId: z.string(),
                  prompt: z.string().describe("Full cinematic image-generation prompt"),
                  model: z.string().optional().describe("Image model id; omit to use the user's selected image model"),
                }),
              },
              generate_locked_image: {
                description:
                  "Generate an image into a node using its locked character portraits as consistency references. Required whenever the node has locked characters.",
                inputSchema: z.object({
                  nodeId: z.string(),
                  prompt: z.string().describe("Full cinematic prompt; keep locked characters' identity and wardrobe fixed"),
                  model: z.string().optional(),
                }),
              },
            },
            providerOptions: {
              openai: {
                forceReasoning: true,
                reasoningEffort: "medium",
                reasoningSummary: "auto",
                store: false,
                include: ["reasoning.encrypted_content"],
              },
            },
          });

          return createUIMessageStreamResponse({
            stream: toUIMessageStream({ stream: result.stream, sendReasoning: true }),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "The studio agent hit an unexpected error";
          return new Response(message, { status: 502 });
        }
      },
    },
  },
});
