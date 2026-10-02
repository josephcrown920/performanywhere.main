import { createFileRoute } from "@tanstack/react-router";
import { json } from "@/lib/server-supabase";
import { gatewayText } from "@/lib/ai/gateway";

export const Route = createFileRoute("/api/prompt/enhance")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          scenePrompt?: string;
          stylePrompt?: string;
          hasOutfit?: boolean;
          hasScene?: boolean;
          hasIdentity?: boolean;
        };
        const scene = body.scenePrompt ?? "";
        const style = body.stylePrompt ?? "";
        const available: string[] = [];
        if (body.hasIdentity) available.push("the performer's appearance and identity from their uploaded photo");
        if (body.hasOutfit) available.push("the uploaded outfit/costume reference");
        if (body.hasScene) available.push("the uploaded scene/environment reference");
        const instruction = `You are a cinematic prompt engineer for AI video generation. Rewrite the user's scene into one vivid, single-paragraph video prompt describing camera movement, lighting, mood and motion. Keep the performer's appearance consistent${
          available.length ? `, drawing on: ${available.join("; ")}` : " as described"
        }. Respond with the prompt only.

Scene: ${scene || "(none provided)"}
Style: ${style || "(none provided)"}`;

        try {
          const { text } = await gatewayText("google/gemini-3.6-flash", instruction);
          return json({ prompt: text.trim() });
        } catch {
          const fallback = [scene, style].filter(Boolean).join(" — ") || "A cinematic performance scene";
          return json({ prompt: fallback });
        }
      },
    },
  },
});

export type PromptEnhanceRoute = typeof Route;
export { json };
