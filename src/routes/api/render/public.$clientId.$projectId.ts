import { createFileRoute } from "@tanstack/react-router";
import { serverSupabase, assertClientId, json, errJson } from "@/lib/server-supabase";

export const Route = createFileRoute("/api/render/public/$clientId/$projectId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const clientId = assertClientId(params.clientId);
          const projectId = assertClientId(params.projectId);
          const db = serverSupabase();
          const { data: project } = await db.from("projects").select("*").eq("id", projectId).eq("client_id", clientId).maybeSingle();
          if (!project) return json({ error: "not_found" }, 404);
          const { data: render } = await db
            .from("project_renders")
            .select("*")
            .eq("project_id", projectId)
            .eq("status", "succeeded")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!render?.output_path) return json({ error: "no_render" }, 404);
          const signed = await db.storage.from("renders").createSignedUrl(render.output_path, 3600);
          if (signed.error || !signed.data) throw new Error(signed.error?.message ?? "signed_url_failed");
          return json({
            id: project.id,
            title: project.title ?? "Untitled",
            provider: render.provider ?? "lovable",
            model: project.selected_model ?? null,
            prompt: render.prompt ?? null,
            created_at: render.created_at,
            videoUrl: signed.data.signedUrl,
          });
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});
