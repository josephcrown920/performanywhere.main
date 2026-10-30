import { createFileRoute } from "@tanstack/react-router";
import { serverSupabase, assertClientId, authClientId, json, errJson } from "@/lib/server-supabase";
import { gatewayVideoPoll } from "@/lib/ai/gateway";

export const Route = createFileRoute("/api/render/poll")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { clientId?: string; projectId?: string };
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
          const syncProject = (patch: Record<string, unknown>) => db.from("projects").update(patch).eq("id", projectId);
          if (render.status === "succeeded" || render.status === "failed") {
            await syncProject(render.status === "succeeded" ? { status: "succeeded", output_path: render.output_path } : { status: "failed", error_message: render.error_message });
            return json({ status: render.status, outputPath: render.output_path ?? undefined, error: render.error_message ?? undefined, provider: render.provider ?? undefined });
          }
          if (!render.provider_task_id) return json({ status: "queued", provider: render.provider ?? undefined });

          const job = await gatewayVideoPoll(render.provider_task_id);
          if ((job.status === "succeeded" || job.status === "completed") && job.url) {
            // Persist the finished clip into private storage (job URLs expire).
            const res = await fetch(job.url);
            if (!res.ok) throw new Error(`download_${res.status}`);
            const buf = await res.arrayBuffer();
            const path = `${clientId}/${projectId}/${render.id}.mp4`;
            const up = await serverSupabase(request).storage.from("renders").upload(path, buf, { contentType: "video/mp4", upsert: true });
            if (up.error) throw new Error(up.error.message);
            await db.from("project_renders").update({ status: "succeeded", output_path: path }).eq("id", render.id);
            await syncProject({ status: "succeeded", output_path: path, error_message: null });
            return json({ status: "succeeded", outputPath: path, provider: render.provider ?? undefined });
          }
          if (job.status === "failed") {
            await db.from("project_renders").update({ status: "failed", error_message: job.error ?? "video job failed" }).eq("id", render.id);
            await syncProject({ status: "failed", error_message: job.error ?? "video job failed" });
            return json({ status: "failed", error: job.error ?? "video job failed", provider: render.provider ?? undefined });
          }
          if (render.status !== job.status) {
            await db.from("project_renders").update({ status: job.status === "queued" ? "queued" : "running" }).eq("id", render.id);
          }
          await syncProject({ status: job.status === "queued" ? "queued" : "running" });
          return json({ status: job.status === "queued" ? "queued" : "running", provider: render.provider ?? undefined });
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});
