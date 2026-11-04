import { createFileRoute } from "@tanstack/react-router";
import { serverSupabase, assertClientId, authClientId, json, errJson } from "@/lib/server-supabase";
import { gatewayVideoStart } from "@/lib/ai/gateway";
import { loadSoul, soulKeyframe, identityPrompt } from "@/lib/soul.server";

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
          const enhanced = (project.enhanced_prompt as string | null)?.trim();
          const prompt =
            enhanced ||
            [scene, style].filter(Boolean).join(" — ") ||
            `${(project.title as string) || "A performance"} restaged cinematically: the same performer, same choreography, new world.`;

          const { data: render, error: rErr } = await db
            .from("project_renders")
            .insert({ project_id: projectId, client_id: clientId, provider: "lovable", status: "queued", prompt, is_lip_sync: lipSync })
            .select("id")
            .single();
          if (rErr) throw new Error(rErr.message);

          // Send the scene photo (uploaded or picked preset) as the visual reference.
          let imageDataUrl: string | undefined;
          const sceneAsset = (assets ?? []).find((a: { kind: string }) => a.kind === "scene") as { storage_path: string; mime_type?: string | null } | undefined;
          if (sceneAsset) {
            const { data: blob } = await db.storage.from("uploads").download(sceneAsset.storage_path);
            if (blob && blob.size < 8_000_000) {
              const bytes = new Uint8Array(await blob.arrayBuffer());
              let bin = "";
              for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
              imageDataUrl = `data:${sceneAsset.mime_type || blob.type || "image/jpeg"};base64,${btoa(bin)}`;
            }
          }

          // Character lock: when a Soul is attached, render a first frame of that
          // exact person inside the scene and start the video from it.
          let videoPrompt = prompt;
          const soulId = project.soul_id as string | null;
          if (soulId) {
            try {
              const { soul, refs } = await loadSoul(db, soulId);
              const frame = await soulKeyframe(soul, refs, prompt, imageDataUrl, body.options?.aspectRatio);
              imageDataUrl = frame.image;
              const notes = soul.reference_profile?.description;
              videoPrompt = `Keep the person from the first frame identical in every shot — same face, hair and build${notes ? ` (${notes})` : ""}. ${prompt}`;
            } catch (soulErr) {
              const msg = soulErr instanceof Error ? soulErr.message : String(soulErr);
              await db.from("project_renders").update({ status: "failed", error_message: `Character lock: ${msg}` }).eq("id", render.id);
              await db.from("projects").update({ status: "failed", error_message: `Character lock: ${msg}` }).eq("id", projectId);
              return json({ error: `Character lock failed: ${msg}` }, 502);
            }
          }

          try {
            const job = await gatewayVideoStart({
              prompt: videoPrompt,
              model: body.model?.startsWith("lovable/") ? body.model.slice("lovable/".length) : undefined,
              durationSeconds: body.options?.duration,
              aspectRatio: body.options?.aspectRatio,
              imageDataUrl,
            });
            await db
              .from("project_renders")
              .update({ status: "running", provider_task_id: job.id })
              .eq("id", render.id);
            await db.from("projects").update({ status: "running", provider: "lovable", error_message: null }).eq("id", projectId);
            return json({ ok: true, provider: "lovable", jobId: render.id });
          } catch (jobErr) {
            const msg = jobErr instanceof Error ? jobErr.message : String(jobErr);
            await db.from("project_renders").update({ status: "failed", error_message: msg }).eq("id", render.id);
            await db.from("projects").update({ status: "failed", error_message: msg }).eq("id", projectId);
            return json({ error: msg }, 502);
          }
        } catch (e) {
          return errJson(e);
        }
      },
    },
  },
});
