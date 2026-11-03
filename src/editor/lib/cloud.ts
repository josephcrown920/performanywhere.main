/** Cloud sync: gallery uploads and saved sessions, scoped to the signed-in user. */
import { supabase } from "@/integrations/supabase/client";
import type { SavedSession } from "@/lib/editor-state";

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Upload a generated asset to the private generations bucket and record it in the gallery. */
export async function saveToCloudGallery(asset: { name: string; kind: string; url: string }, prompt?: string) {
  const userId = await currentUserId();
  if (!userId) return; // signed out: stays local only
  try {
    const res = await fetch(asset.url);
    if (!res.ok) return;
    const blob = await res.blob();
    const ext = asset.kind === "video" ? "mp4" : "png";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("generations").upload(path, blob, { contentType: blob.type || "application/octet-stream" });
    if (error) return;
    await supabase.from("gallery_items").insert({ user_id: userId, kind: asset.kind, name: asset.name, storage_path: path, prompt: prompt ?? null });
  } catch {
    // local copy already kept; cloud sync is best-effort
  }
}

/** List the signed-in user's cloud gallery as displayable signed URLs. */
export async function listCloudGallery() {
  const userId = await currentUserId();
  if (!userId) return [];
  const { data } = await supabase.from("gallery_items").select("id, kind, name, storage_path, created_at").order("created_at", { ascending: false }).limit(60);
  if (!data) return [];
  const paths = data.map((d) => d.storage_path);
  const { data: signed } = await supabase.storage.from("generations").createSignedUrls(paths, 3600);
  return data.map((d, i) => ({ ...d, url: signed?.[i]?.signedUrl ?? "" }));
}

/** Upsert a saved session to the cloud so it syncs across devices. */
export async function syncSessionToCloud(session: SavedSession) {
  const userId = await currentUserId();
  if (!userId) return false;
  const state = { assets: session.assets, clips: session.clips, messages: session.messages, agent: session.agent, imageEngine: session.imageEngine, videoEngine: session.videoEngine };
  const { error } = await supabase.from("studio_sessions").upsert({ id: session.id, user_id: userId, name: session.name, state, updated_at: new Date().toISOString() });
  if (error) throw error;
  return true;
}

/** Pull the signed-in user's cloud sessions. */
export async function listCloudSessions(): Promise<SavedSession[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  const { data } = await supabase.from("studio_sessions").select("id, name, state, updated_at").order("updated_at", { ascending: false }).limit(30);
  if (!data) return [];
  return data.map((row) => {
    const s = (row.state ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      name: row.name,
      updatedAt: row.updated_at,
      assets: (s["assets"] as SavedSession["assets"]) ?? [],
      clips: (s["clips"] as SavedSession["clips"]) ?? [],
      messages: (s["messages"] as SavedSession["messages"]) ?? [],
      agent: (s["agent"] as string) ?? "orchestrator",
      imageEngine: (s["imageEngine"] as string) ?? "",
      videoEngine: (s["videoEngine"] as string) ?? "",
    };
  });
}
