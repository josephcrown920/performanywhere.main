export const GATEWAY = "https://ai.gateway.lovable.dev";
export const IMAGE_MODEL = "openai/gpt-image-2.5-sunburst";
export const VIDEO_MODEL = "google/veo-3.1-fast";

/** BytePlus ModelArk — enabled by setting ARK_API_KEY. */
export const ARK_BASE = "https://ark.ap-southeast.bytepluses.com/api/v3";

export function arkKey() {
  return process.env["ARK_API_KEY"] ?? "";
}

export function apiKey() {
  const k = process.env["LOVABLE_API_KEY"];
  if (k) return k;
  // Redeploy fallback: use the owner's OpenRouter key when Lovable AI is absent.
  const or = process.env["OPENROUTER_API_KEY"];
  if (or) return or;
  throw new Response("AI is not configured", { status: 500 });
}

/** True when apiKey() resolved to an OpenRouter key (chat/completions compatible). */
export function isOpenRouterKey(key: string) {
  return key.startsWith("sk-or-");
}

export function chatCompletionsUrl(key: string) {
  return isOpenRouterKey(key) ? "https://openrouter.ai/api/v1/chat/completions" : `${GATEWAY}/v1/chat/completions`;
}

export function passthrough(upstream: Response) {
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json", "Cache-Control": "no-cache" },
  });
}

/** Statuses where the primary gateway can't serve and a backup provider should try. */
export function shouldFallback(status: number) {
  return status === 402 || status === 403 || status === 429 || status >= 500;
}

/** OpenRouter image backup: generate or edit via an image-output chat model. */
export async function openRouterImage(prompt: string, images: string[] = []): Promise<Response | null> {
  const key = process.env["OPENROUTER_API_KEY"];
  if (!key) return null;
  const content: unknown[] = [{ type: "text", text: prompt }, ...images.map((url) => ({ type: "image_url", image_url: { url } }))];
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "GUI Video Studio" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash-image", modalities: ["image", "text"], messages: [{ role: "user", content }] }),
  });
  const d = (await r.json().catch(() => ({}))) as { choices?: { message?: { images?: { image_url?: { url?: string } }[] } }[]; error?: { message?: string } };
  const url = d.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!r.ok || !url) return Response.json({ error: { message: `Backup image service failed: ${d.error?.message ?? r.status}` } }, { status: r.ok ? 502 : r.status });
  return Response.json({ data: [{ url }] });
}
