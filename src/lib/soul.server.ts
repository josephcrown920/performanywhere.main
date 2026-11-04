// Soul identities (merged from Soul Studio): reference-photo character lock.
// A Soul is a set of reference photos + a written identity profile; every
// generation that uses it receives those photos so the same person appears.
import type { SupabaseClient } from "@supabase/supabase-js";

const GW = "https://ai.gateway.lovable.dev";
const KEY = () => process.env.LOVABLE_API_KEY!;
export const SOUL_IMAGE_MODELS = ["google/gemini-3-pro-image", "google/gemini-3.1-flash-lite-image", "openai/gpt-image-2"];

export type SoulRow = { id: string; user_id: string; name: string; reference_image_paths: string[]; reference_profile: { description?: string } | null };

function toDataUrl(bytes: Uint8Array, mime: string) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${mime};base64,${btoa(bin)}`;
}

export async function blobToDataUrl(blob: Blob, fallbackMime = "image/jpeg") {
  return toDataUrl(new Uint8Array(await blob.arrayBuffer()), blob.type || fallbackMime);
}

/** Loads a Soul the caller owns (RLS) and up to `max` reference photos as data URLs. */
export async function loadSoul(db: SupabaseClient, soulId: string, max = 3) {
  const { data, error } = await db.from("souls").select("id,user_id,name,reference_image_paths,reference_profile").eq("id", soulId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("soul_not_found");
  const soul = data as SoulRow;
  const refs: string[] = [];
  for (const path of soul.reference_image_paths.slice(0, max)) {
    const { data: blob } = await db.storage.from("souls").download(path);
    if (blob && blob.size < 8_000_000) refs.push(await blobToDataUrl(blob));
  }
  if (!refs.length) throw new Error("soul_has_no_photos");
  return { soul, refs };
}

function extractImage(j: unknown): string | null {
  const m = (j as { choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }> })?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  return m ?? null;
}

/** Image generation with several reference images attached. Falls back across models. */
export async function multiRefImage(prompt: string, images: string[]): Promise<{ image: string; model: string }> {
  let last = "";
  for (const model of SOUL_IMAGE_MODELS) {
    const res = await fetch(`${GW}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY()}` },
      body: JSON.stringify({
        model,
        modalities: ["image", "text"],
        messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...images.map((url) => ({ type: "image_url", image_url: { url } }))] }],
      }),
    });
    if (!res.ok) { last = `${res.status}: ${(await res.text()).slice(0, 200)}`; continue; }
    const img = extractImage(await res.json());
    if (img) return { image: img, model };
    last = "no_output";
  }
  throw new Error(`soul_image_failed ${last}`);
}

export function identityPrompt(soul: SoulRow, refCount: number) {
  const desc = soul.reference_profile?.description;
  return `The first ${refCount} image(s) are identity references of ONE person named "${soul.name}". Keep exactly the same face, facial structure, skin tone, hairline, hairstyle, tattoos and body type. Do not beautify, age, or change ethnicity.${desc ? ` Identity notes: ${desc}` : ""}`;
}

/** Builds a first frame: the Soul placed into the scene, used to start the video. */
export async function soulKeyframe(soul: SoulRow, refs: string[], scenePrompt: string, sceneImage?: string, aspect?: string) {
  const prompt = `${identityPrompt(soul, refs.length)}${sceneImage ? " The last image is the environment: place the person inside it, matching its light and perspective." : ""} Create one photoreal cinematic film still, ${aspect || "9:16"} framing, of this person: ${scenePrompt}`;
  return multiRefImage(prompt, sceneImage ? [...refs, sceneImage] : refs);
}
