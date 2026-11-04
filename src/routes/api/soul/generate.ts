import { createFileRoute } from "@tanstack/react-router";
import { serverSupabase, authClientId, assertClientId, json, errJson } from "@/lib/server-supabase";
import { loadSoul, soulKeyframe } from "@/lib/soul.server";

export const Route = createFileRoute("/api/soul/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await authClientId(request);
          const body = (await request.json()) as { soulId?: string; prompt?: string; aspectRatio?: string };
          const soulId = assertClientId(body.soulId);
          const prompt = (body.prompt ?? "").trim().slice(0, 1500);
          if (!prompt) return json({ error: "Describe the shot first." }, 400);
          const { soul, refs } = await loadSoul(serverSupabase(request), soulId);
          const out = await soulKeyframe(soul, refs, prompt, undefined, body.aspectRatio);
          return json(out);
        } catch (e) { return errJson(e); }
      },
    },
  },
});
