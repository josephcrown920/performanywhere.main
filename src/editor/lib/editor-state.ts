import type { TrackId } from "@/lib/agents";

export type MediaKind = "video" | "image" | "audio";
export type EditorAsset = { id: string; name: string; kind: MediaKind; url: string; dur: number; generated?: boolean };
export type EditorClip = {
  id: string; assetId: string; track: TrackId; start: number; dur: number; inPoint: number;
  name: string; volume: number; opacity: number; speed: number; filter: string;
};

export type SavedSession = {
  id: string;
  name: string;
  updatedAt: string;
  assets: EditorAsset[];
  clips: EditorClip[];
  messages: { role: "user" | "assistant"; text: string; steps?: string[]; agent?: string }[];
  agent: string;
  imageEngine: string;
  videoEngine: string;
};

export const REQUIRED_ORCHESTRATOR_SPECIALISTS = ["astra", "codex", "fable"] as const;

export function nextTrackStart(clips: EditorClip[], track: TrackId) {
  return clips.filter((clip) => clip.track === track).reduce((end, clip) => Math.max(end, clip.start + clip.dur), 0);
}

export function clipForAsset(asset: EditorAsset, clips: EditorClip[], id: string): EditorClip {
  const track: TrackId = asset.kind === "audio" ? "A2" : "V1";
  return {
    id,
    assetId: asset.id,
    track,
    start: nextTrackStart(clips, track),
    dur: asset.dur,
    inPoint: 0,
    name: asset.name.replace(/\.[^.]+$/, ""),
    volume: 1,
    opacity: 1,
    speed: 1,
    filter: "none",
  };
}

export function serializableAssets(assets: EditorAsset[]) {
  return assets.filter((asset) => !asset.url.startsWith("blob:"));
}

/** Preserve generated object URLs as durable media, but never persist temporary uploads. */
export async function serializableTimeline(
  assets: EditorAsset[],
  clips: EditorClip[],
  encodeMedia: (url: string) => Promise<string>,
) {
  const durableAssets = await Promise.all(assets
    .filter((asset) => !asset.url.startsWith("blob:") || asset.generated)
    .map(async (asset) => asset.url.startsWith("blob:")
      ? { ...asset, url: await encodeMedia(asset.url) }
      : asset));
  const ids = new Set(durableAssets.map((asset) => asset.id));
  return { assets: durableAssets, clips: clips.filter((clip) => ids.has(clip.assetId)) };
}

/** A failed browser write must not prevent cloud saving or imply durable success. */
export async function persistSession(
  session: SavedSession,
  sessions: SavedSession[],
  storage: Pick<Storage, "setItem">,
  sync: (session: SavedSession) => Promise<boolean>,
) {
  const next = [session, ...sessions].slice(0, 12);
  let localSaved = false;
  let cloudSaved = false;
  try {
    storage.setItem("reel-editor-sessions", JSON.stringify(next));
    localSaved = true;
  } catch {
    // Storage can be full or blocked; still attempt the independent cloud copy.
  }
  try {
    cloudSaved = await sync(session);
  } catch {
    // Surface the combined persistence result to the editor.
  }
  return { localSaved, cloudSaved, sessions: localSaved || cloudSaved ? next : sessions };
}
/** Starter cut shown on a fresh session: the fire house photo, then the fire performance clip. */
export function starterTimeline(urls: string[], names: string[] = ["fire-house.jpg"]): { assets: EditorAsset[]; clips: EditorClip[] } {
  const assets: EditorAsset[] = urls.map((url, i) => ({ id: `starter-${i}`, name: names[i] ?? `starter-${i}.jpg`, kind: /\.(mp4|webm|mov)(\?|$)/i.test(url) ? "video" : "image", url, dur: /\.(mp4|webm|mov)(\?|$)/i.test(url) ? 10 : 4 }));
  const clips: EditorClip[] = [];
  for (const a of assets) clips.push(clipForAsset(a, clips, `starter-clip-${a.id}`));
  return { assets, clips };
}
