import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayRunIdFetch } from "@/flow/lib/ai/run-id";
import { decorateGeneratedShots, generateFallbackShots } from "@/flow/lib/director-fallback";
import type { Shot } from "@/flow/data/demo";

export type DirectorResult = { shots: Shot[]; source: "ai" | "offline" };

const shotListSchema = z.object({
  shots: z.array(
    z.object({
      scene: z.string().describe("Scene label like SC 01"),
      number: z.string().describe("Shot number within the scene, e.g. 1, 2, 3A"),
      title: z.string().describe("Short evocative shot title, max 6 words"),
      description: z.string().describe("What happens in the shot, one or two vivid sentences"),
      camera: z.string().describe("Camera movement and framing note"),
      duration: z.string().describe("Estimated duration like 4s"),
    }),
  ),
});

const DIRECTOR_SYSTEM = (style: string) =>
  [
    "You are Flowaurora's AI Director — a veteran cinematographer and story editor.",
    "Given a logline, return a cinematic shot list of 6 to 8 shots that covers a complete arc: cold open, escalation, turning point, climax, resolve.",
    "Each shot needs a vivid one-to-two sentence description, a concrete camera movement note, and an estimated duration between 3s and 9s.",
    `Style preset for tone and lighting notes: ${style}. Never mention the style name in descriptions.`,
    "Return only the structured shot list.",
  ].join(" ");

export async function directShotList(logline: string, style: string): Promise<DirectorResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    return { shots: generateFallbackShots(logline), source: "offline" };
  }

  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  try {
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system: DIRECTOR_SYSTEM(style),
      prompt: `LOGLINE:\n${logline}\n\nSTYLE PRESET: ${style}`,
      output: Output.object({ schema: shotListSchema }),
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "medium",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    const parsed = await result.output;
    const list = parsed?.shots ?? [];
    if (list.length === 0) {
      throw new Error("AI Director returned an empty shot list");
    }

    return {
      shots: decorateGeneratedShots(
        list.slice(0, 10).map((shot) => ({
          scene: shot.scene,
          number: shot.number,
          title: shot.title,
          description: shot.description,
          camera: shot.camera,
          duration: shot.duration,
        })),
      ),
      source: "ai",
    };
  } catch (error) {
    console.error("AI Director call failed, using offline fallback:", error);
    return { shots: generateFallbackShots(logline), source: "offline" };
  }
}
