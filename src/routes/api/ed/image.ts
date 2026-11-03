import { createFileRoute } from "@tanstack/react-router";
import { GATEWAY, IMAGE_MODEL, apiKey, passthrough, shouldFallback, openRouterImage } from "@/editor/lib/gateway.server";
import { IMAGE_ENGINES } from "@/editor/lib/engines";
import { arkFetch, arkError } from "@/editor/lib/ark.server";

async function arkImage(model: string, prompt: string, image?: string | string[]) {
  const r = await arkFetch("/images/generations", { method: "POST", body: JSON.stringify({ model, prompt, size: "2K", response_format: "b64_json", watermark: false, ...(image ? { image } : {}) }) });
  if (!r.ok) return arkError(r);
  return passthrough(r);
}

function resolve(engine?: string) {
  const e = IMAGE_ENGINES.find((x) => x.id === engine);
  if (!e) return { model: IMAGE_MODEL };
  if (!e.available || !e.model) return { error: `${e.name} is not available on this workspace yet. Pick another image engine.` };
  return { model: e.model, ark: e.provider === "ark" };
}

// JSON {prompt, engine} = generate; multipart (prompt + image + engine) = edit by prompt
export const Route = createFileRoute("/api/ed/image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const type = request.headers.get("content-type") ?? "";
        if (type.includes("multipart")) {
          const form = await request.formData();
          if (!String(form.get("prompt") ?? "").trim()) return Response.json({ error: { message: "Prompt required" } }, { status: 400 });
          const r = resolve(String(form.get("engine") ?? ""));
          if (r.error || !r.model) return Response.json({ error: { message: r.error ?? "Image model unavailable" } }, { status: 400 });
          if (r.ark) {
            const files = [...form.getAll("image"), ...form.getAll("image[]")].filter((file): file is File => file instanceof File);
            const urls = await Promise.all(files.map(async (file) => {
              const buf = new Uint8Array(await file.arrayBuffer());
              let bin = "";
              for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
              return `data:${file.type || "image/png"};base64,${btoa(bin)}`;
            }));
            return arkImage(r.model, String(form.get("prompt") ?? ""), urls.length > 1 ? urls : urls[0]);
          }
          const key = apiKey();
          const prompt = String(form.get("prompt") ?? "");
          const files = [...form.getAll("image"), ...form.getAll("image[]")].filter((file): file is File => file instanceof File);
          form.set("model", r.model);
          form.delete("engine");
          form.delete("stream");
          const up = await fetch(`${GATEWAY}/v1/images/edits`, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
          if (shouldFallback(up.status)) {
            const urls = await Promise.all(files.map(async (file) => {
              const buf = new Uint8Array(await file.arrayBuffer());
              let bin = "";
              for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
              return `data:${file.type || "image/png"};base64,${btoa(bin)}`;
            }));
            const fb = await openRouterImage(prompt, urls);
            if (fb) return fb;
          }
          return passthrough(up);
        }
        const { prompt, engine } = (await request.json()) as { prompt?: string; engine?: string };
        if (!prompt?.trim()) return new Response("Prompt required", { status: 400 });
        const r = resolve(engine);
        if (r.error || !r.model) return Response.json({ error: { message: r.error ?? "Image model unavailable" } }, { status: 400 });
        if (r.ark) return arkImage(r.model, prompt);
        const key = apiKey();
        const up = await fetch(`${GATEWAY}/v1/images/generations`, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: r.model, prompt, size: "1536x1024" }),
        });
        if (shouldFallback(up.status)) {
          const fb = await openRouterImage(prompt);
          if (fb) return fb;
        }
        return passthrough(up);
      },
    },
  },
});
