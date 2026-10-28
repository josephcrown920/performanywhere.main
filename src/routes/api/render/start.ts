import { createFileRoute } from "@tanstack/react-router";
import { serverSupabase, assertClientId, authClientId, json, errJson } from "@/lib/server-supabase";
import { gatewayVideoStart } from "@/lib/ai/gateway";

export const Route = createFileRoute("/api/render/start")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            clientId?: string;
            projectId?: string;
            model?: string;
            options?: { duration?: number; aspectRatio?: string; motionStrength?: number; lipSync?: boolean };
          };
          const clientId = await authClientId(request, body.clientId);
          const projectId = assertClientId(body.projectId);
          const db = serverSupabase(request);

          const { data: project, error: pErr } = await db.from("projects").select("*").eq("id", projectId).maybeSingle();
          if (pErr) throw new Error(pErr.message);
          if (!project) throw new Error("project_not_found");

          const { data: assets } = await db.from("project_assets").select("*").eq("project_id", projectId);
          const kinds = new Set((assets ?? []).map((a: { kind: string }) => a.kind));

          const lipSync = !!body.options?.lipSync;
          if (lipSync && !(kinds.has("performance") && kinds.has("audio"))) {
            return json({ error: "Lip sync needs a performance video and an audio track uploaded to the project." }, 400);
          }

          const scene = project.scene_prompt as string | null;
          const style = project.style_prompt as string | null;
          const prompt =
            [scene, style].filter(Boolean).join(" — ") ||
            `${(project.title as string) || "A performance"} restaged cinematically: the same performer, same choreography, new world.`;

          const { data: render, error: rErr } = await db
            .from("project_renders")
            .insert({ project_id: projectId, client_id: clientId, provider: "lovable", status: "queued", prompt, is_lip_sync: lipSync })
            .select("id")
            .single();
          if (rErr) throw new Error(rErr.message);

          try {
            const job = await gatewayVideoStart({
              prompt,
              model: body.model?.startsWith("lovable/") ? body.model.slice("lovable/".length) : undefined,
              durationSeconds: body.options?.duration,
              aspectRatio: body.options?.aspectRatio,
            });
            await db
              .from("project_renders")
              .update({ status: "running", provider_task_id: job.id })
              .eq("id", render.id);
            return json({ ok: true, provider: "lovable", jobId: render.id });
          } catch (jobErr) {
            const msg = jobErr instanceof Error ? jobErr.message : String(jobErr);
            await db.from("project_renders").update({ status: "failed", error_message: msg }).eq("id", render.id);
            return json({ error: msg }, 502);
          }
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});
