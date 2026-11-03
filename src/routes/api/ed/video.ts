import { createFileRoute } from "@tanstack/react-router";
import { GATEWAY, VIDEO_MODEL, apiKey, passthrough } from "@/editor/lib/gateway.server";
import { VIDEO_ENGINES } from "@/editor/lib/engines";
import { arkFetch, arkError } from "@/editor/lib/ark.server";
import { requireDepth, videoSettings } from "@/editor/lib/generation-policy";

type Media = { data: string; mime: string };
type Body = { prompt: string; engine?: string; motion?: string; duration?: string; resolution?: string; draft?: boolean; image?: Media; lastFrame?: Media; video?: Media; audio?: Media; depth?: Media; refs?: Media[] };

// Creates a video job. Client polls /api/video/$id.
export const Route = createFileRoute("/api/ed/video")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const b = (await request.json()) as Body;
        if (!b.prompt?.trim()) return new Response("Prompt required", { status: 400 });

        const e = VIDEO_ENGINES.find((x) => x.id === b.engine);
        if (e && (!e.available || !e.model)) {
          return Response.json({ error: { message: `${e.name} is not available on this workspace yet. Pick another video engine.` } }, { status: 400 });
        }
        const model = e?.model ?? VIDEO_MODEL;
        const settings = videoSettings(b.draft === true, model, b.duration, b.resolution);
        const res = settings.resolution;
        try { requireDepth(b.motion ?? "", Boolean(b.depth)); } catch (error) {
          return Response.json({ error: { message: error instanceof Error ? error.message : "Depth required" } }, { status: 400 });
        }

        const prompt = b.motion ? `${b.prompt}\n\n${b.motion}` : b.prompt;
        if (e?.provider === "ark") {
          const secs = parseInt(settings.duration, 10);
          const content: unknown[] = [{ type: "text", text: `${prompt} --duration ${secs} --resolution ${res} --ratio 16:9` }];
          if (b.image) content.push({ type: "image_url", image_url: { url: `data:${b.image.mime};base64,${b.image.data}` }, ...(b.lastFrame ? { role: "first_frame" } : {}) });
          if (b.lastFrame) content.push({ type: "image_url", image_url: { url: `data:${b.lastFrame.mime};base64,${b.lastFrame.data}` }, role: "last_frame" });
          if (b.depth) content.push({ type: "image_url", image_url: { url: `data:${b.depth.mime};base64,${b.depth.data}` } });
          for (const r of b.refs ?? []) content.push({ type: "image_url", image_url: { url: `data:${r.mime};base64,${r.data}` } });
          if (b.audio) content.push({ type: "audio_url", audio_url: { url: `data:${b.audio.mime};base64,${b.audio.data}` } });
          if (b.video) content.push({ type: "video_url", video_url: { url: `data:${b.video.mime};base64,${b.video.data}` } });
          const r = await arkFetch("/contents/generations/tasks", { method: "POST", body: JSON.stringify({ model, content }) });
          if (!r.ok) return arkError(r);
          const job = (await r.json()) as { id?: string };
          return Response.json({ id: `ark_${job.id}`, status: "queued" });
        }
        const key = apiKey();
        if (model.startsWith("google/veo-")) {
          if (b.depth || b.refs?.length || b.video || b.audio) return Response.json({ error: { message: "This Veo path does not support depth-guided motion or audio inputs. Choose Gemini Omni for depth-guided renders." } }, { status: 400 });
          return passthrough(await fetch(`${GATEWAY}/v1/videos`, {
            method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model, instances: [{ prompt, ...(b.image ? { image: { bytesBase64Encoded: b.image.data, mimeType: b.image.mime } } : {}), ...(b.lastFrame ? { lastFrame: { bytesBase64Encoded: b.lastFrame.data, mimeType: b.lastFrame.mime } } : {}) }], parameters: { durationSeconds: parseInt(settings.duration, 10), resolution: res, sampleCount: 1, generateAudio: true, ...(!b.image ? { aspectRatio: "16:9" } : {}) } }),
          }));
        }
        if (b.audio) return Response.json({ error: { message: "Gemini Omni does not accept uploaded audio for lip sync. Use a connected dedicated avatar engine." } }, { status: 400 });
        const parts: unknown[] = [{ type: "text", text: prompt }];
        if (b.image) parts.push({ type: "image", data: b.image.data, mime_type: b.image.mime });
        if (b.depth) parts.push({ type: "image", data: b.depth.data, mime_type: b.depth.mime });
        if (b.lastFrame) parts.push({ type: "image", data: b.lastFrame.data, mime_type: b.lastFrame.mime });
        for (const r of (b.refs ?? []).slice(0, 6)) parts.push({ type: "image", data: r.data, mime_type: r.mime });
        if (b.video) parts.push({ type: "video", data: b.video.data, mime_type: b.video.mime });
        const response_format: Record<string, string> = { type: "video", resolution: res, duration: settings.duration };
        if (!b.video) response_format["aspect_ratio"] = "16:9";

        return passthrough(
          await fetch(`${GATEWAY}/v1/videos`, {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model, input: parts.length === 1 ? prompt : parts, response_format }),
          }),
        );
      },
    },
  },
});
