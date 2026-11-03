/** Browser helpers that call the app's own generation endpoints. */
import { withCreativeContext } from "@/agent/lib/guy/creative-context";

const DRAFT_KEY = "reel-draft-mode";
/** Draft mode: quick low-res, short preview renders. */
export function isDraftMode() {
  return typeof localStorage !== "undefined" && localStorage.getItem(DRAFT_KEY) === "1";
}
export function setDraftMode(on: boolean) {
  localStorage.setItem(DRAFT_KEY, on ? "1" : "0");
}

async function fileToMedia(file: Blob) {
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return { data: btoa(bin), mime: file.type || "image/png" };
}

export async function urlToBlob(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not download the media.");
  return response.blob();
}

type ImgResp = { data?: { b64_json?: string; url?: string }[]; error?: { message?: string } | string };

function errMsg(d: unknown, fallback: string) {
  const o = d as { error?: { message?: string } | string; message?: string; status?: number };
  const e = o?.error;
  const msg = typeof e === "string" ? e : e?.message ?? o?.message;
  if (o?.status === 402) return "Your workspace is out of AI credits. Top up to keep generating.";
  return msg ?? fallback;
}

/** Generate an image, or edit `source` by prompt when given. Returns a displayable URL. */
export async function generateImage(prompt: string, engine: string, source?: Blob, raw = false, refs: Blob[] = []): Promise<string> {
  if (!raw) prompt = withCreativeContext(prompt);
  let r: Response;
  if (source) {
    const form = new FormData();
    form.set("prompt", prompt);
    form.set("engine", engine);
    if (refs.length) {
      form.append("image[]", source, "source.png");
      refs.forEach((ref, i) => form.append("image[]", ref, `reference_${i}.png`));
    } else form.set("image", source, "source.png");
    r = await fetch("/api/va/image", { method: "POST", body: form });
  } else {
    r = await fetch("/api/va/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, engine }) });
  }
  const text = await r.text();
  let d: ImgResp = {};
  try { d = JSON.parse(text) as ImgResp; } catch { throw new Error(text.slice(0, 160) || "Image service error"); }
  const item = d.data?.[0];
  const url = item?.b64_json ? `data:image/png;base64,${item.b64_json}` : item?.url;
  if (!url) throw new Error(errMsg(d, "The image service didn't return an image."));
  return url;
}

/** Create a video job, poll until finished, return an object URL for the clip. */
export async function generateVideo(
  prompt: string,
  engine: string,
  motion: string,
  opts: { image?: Blob | undefined; lastFrame?: Blob | undefined; video?: Blob | undefined; audio?: Blob | undefined; depth?: Blob | undefined; refs?: Blob[]; duration?: string; resolution?: string; onStatus?: (s: string) => void } = {},
): Promise<string> {
  const draft = isDraftMode();
  const body: Record<string, unknown> = { prompt: withCreativeContext(prompt), engine, motion, duration: draft ? "4s" : opts.duration ?? "6s", resolution: opts.resolution, draft };
  let image = opts.image;
  let depth = opts.depth;
  if (motion.trim() && !depth) {
    if (!image) {
      opts.onStatus?.("Creating the scene reference…");
      image = await urlToBlob(await generateImage(prompt, ""));
    }
    opts.onStatus?.("Building depth guide…");
    depth = await urlToBlob(await depthMap(image));
  }
  if (depth) body["prompt"] = `${body["prompt"]}\n${DEPTH_GUIDE}`;
  if (opts.lastFrame) {
    body["prompt"] = `${body["prompt"]}\n${LAST_FRAME_GUIDE}`;
    body["lastFrame"] = await fileToMedia(opts.lastFrame);
  }
  if (image) body["image"] = await fileToMedia(image);
  if (opts.video) body["video"] = await fileToMedia(opts.video);
  if (opts.audio) body["audio"] = await fileToMedia(opts.audio);
  if (depth) body["depth"] = await fileToMedia(depth);
  if (opts.refs?.length) body["refs"] = await Promise.all(opts.refs.map(fileToMedia));
  const r = await fetch("/api/va/video", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const job = (await r.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!r.ok || !job.id) throw new Error(errMsg(job, "The video service rejected the request."));
  const started = Date.now();
  for (;;) {
    await new Promise((res) => setTimeout(res, 5000));
    const p = (await (await fetch(`/api/va/video/${job.id}`)).json().catch(() => ({}))) as { status?: string; error?: unknown };
    const s = (p.status ?? "").toLowerCase();
    opts.onStatus?.(s || "working");
    if (["completed", "succeeded", "done"].includes(s)) break;
    if (["failed", "error", "cancelled", "canceled"].includes(s)) throw new Error(errMsg(p, "Video generation failed."));
    if (Date.now() - started > 8 * 60 * 1000) throw new Error("Video took too long — try a shorter or simpler prompt.");
  }
  const content = await fetch(`/api/va/video/${job.id}/content`);
  if (!content.ok) throw new Error("The finished video could not be downloaded.");
  const blob = await content.blob();
  return URL.createObjectURL(blob);
}

export const DEPTH_PROMPT = "Convert this image into a monocular depth map pass: smooth grayscale only, nearest surfaces pure white, farthest pure black, keep exact silhouettes and geometry, no texture, no color, no text.";
/** Depth pass for an image. Every motion-control and style-transfer job runs through this first. */
export async function depthMap(source: Blob): Promise<string> {
  return generateImage(DEPTH_PROMPT, "", source, true);
}
export const DEPTH_GUIDE = "The second image is a grayscale depth GUIDE, not a final frame or style reference (white = near, black = far). Use it to preserve distances, silhouettes, occlusion and camera parallax. Do not render the grayscale guide in the result.";
export const LAST_FRAME_GUIDE = "A LAST FRAME image is attached: the video must start on the first image and arrive exactly on the last-frame image, interpolating pose, identity and scene smoothly between them.";
