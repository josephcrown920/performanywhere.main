import { createFileRoute } from "@tanstack/react-router";
import { serverSupabase, assertClientId, authClientId, json, errJson } from "@/lib/server-supabase";
import { gatewayVideoStart } from "@/lib/ai/gateway";

export const Route = createFileRoute("/api/render/retry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { clientId?: string; projectId?: string; provider?: string };
          const clientId = await authClientId(request, body.clientId);
          const projectId = assertClientId(body.projectId);
          const db = serverSupabase(request);

          const { data: render } = await db
            .from("project_renders")
            .select("*")
            .eq("project_id", projectId)
            .eq("client_id", clientId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!render) throw new Error("render_not_found");
          if (!render.prompt) throw new Error("render_prompt_missing");

          const job = await gatewayVideoStart({ prompt: render.prompt });
          await db
            .from("project_renders")
            .update({ status: "running", provider: "lovable", provider_task_id: job.id, error_message: null, output_path: null })
            .eq("id", render.id);
          await db.from("projects").update({ status: "running", error_message: null, output_path: null }).eq("id", projectId);
          return json({ ok: true });
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});
