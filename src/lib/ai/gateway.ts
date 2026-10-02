// Lovable AI Gateway client: text, image and video generation without provider keys.
const GW = "https://ai.gateway.lovable.dev";
const KEY = () => process.env.LOVABLE_API_KEY;

export type GatewayTextResult = { text: string };

export async function gatewayText(model: string, prompt: string, systemPrompt?: string): Promise<GatewayTextResult> {
  const res = await fetch(`${GW}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY()}` },
    body: JSON.stringify({
      model,
      messages: [...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []), { role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`gateway_text_${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = j.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("gateway_text_empty");
  return { text };
}

// Image models return choices[0].message.images[].image_url.url (data URL or https URL).
function extractImage(j: unknown): string | null {
  const typed = j as { choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }>; content?: string | null } }> };
  const url = typed.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (url) return url;
  const s = JSON.stringify(j);
  const m = s.match(/"b64_json"\s*:\s*"([^"]+)"/) ?? s.match(/"image_url"\s*:\s*"(https:[^"]+)"/) ?? s.match(/"(https:\/\/[^"]*\.(?:png|jpe?g|webp)[^"]*)"/i);
  if (!m) return null;
  return m[1].startsWith("http") ? m[1] : `data:image/png;base64,${m[1]}`;
}

export async function gatewayImage(model: string, prompt: string, options: Record<string, unknown> = {}): Promise<string> {
  const res = await fetch(`${GW}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY()}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], ...options }),
  });
  if (!res.ok) throw new Error(`gateway_image_${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  const url = extractImage(j);
  if (!url) throw new Error("gateway_image_no_output");
  return url;
}

// Video: POST /v1/videos creates a job, GET /v1/videos/{id} polls it.
export type VideoJob = { id: string; status: string; url?: string; error?: string };

export async function gatewayVideoStart(opts: {
  prompt: string;
  model?: string;
  imageDataUrl?: string;
  durationSeconds?: number;
  aspectRatio?: string;
}): Promise<VideoJob> {
  const body: Record<string, unknown> = { model: opts.model ?? "google/veo-3.1-lite", prompt: opts.prompt };
  if (opts.imageDataUrl) body.image = opts.imageDataUrl;
  if (opts.durationSeconds) body.duration = `${opts.durationSeconds}s`;
  if (opts.aspectRatio) body.aspect_ratio = opts.aspectRatio;
  const res = await fetch(`${GW}/v1/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY()}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`gateway_video_${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = (await res.json()) as Record<string, unknown>;
  const id = (j.id ?? j.job_id ?? j.task_id) as string | undefined;
  if (!id) throw new Error("gateway_video_no_job_id");
  return { id, status: String(j.status ?? "queued") };
}

export async function gatewayVideoPoll(jobId: string): Promise<VideoJob> {
  const res = await fetch(`${GW}/v1/videos/${jobId}`, { headers: { Authorization: `Bearer ${KEY()}` } });
  if (!res.ok) throw new Error(`gateway_video_poll_${res.status}`);
  const j = (await res.json()) as Record<string, unknown>;
  const status = String(j.status ?? "running");
  // The finished clip is served at /content (redirects to storage). Keep the
  // auth header on the redirect by fetching inline rather than returning a URL.
  const url = status === "completed" ? `${GW}/v1/videos/${jobId}/content` : undefined;
  return { id: jobId, status, url, error: j.error ? String(j.error) : undefined };
}
