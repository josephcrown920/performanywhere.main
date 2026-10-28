import { createFileRoute } from "@tanstack/react-router";
import { serverSupabase, assertClientId, authClientId, json, errJson } from "@/lib/server-supabase";

export const Route = createFileRoute("/api/orchestrate/list")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { clientId?: string };
          const clientId = await authClientId(request, body.clientId);
          const db = serverSupabase(request);
          const { data, error } = await db
            .from("generations")
            .select("id, modality, provider, model, prompt, status, output_url, output_text, credits_used, created_at")
            .eq("client_id", clientId)
            .order("created_at", { ascending: false })
            .limit(50);
          if (error) throw new Error(error.message);
          return json(data ?? []);
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});
