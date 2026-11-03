import { ModelLogo } from "@/agent/components/guy/ModelLogo";
import { ThemePicker } from "@/agent/components/guy/ThemePicker";
import { generationIntent } from "@/agent/lib/guy/chat-intent";
import { CreativeTools } from "@/agent/components/guy/CreativeTools";
import { WorkflowStudio } from "@/agent/components/guy/WorkflowStudio";
import { PerformStudio } from "@/agent/components/guy/PerformStudio";
import { TimelineHoverPreview } from "@/agent/components/guy/TimelineHoverPreview";
import { sourceTime } from "@/agent/lib/guy/media-time";
import { EffectPreview } from "@/agent/components/guy/EffectPreview";
import { supabase } from "@/integrations/supabase/client";
import { listCloudSessions, saveToCloudGallery, syncSessionToCloud } from "@/agent/lib/guy/cloud";
import { displayName, greetingText } from "@/agent/lib/guy/greeting";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Clapperboard,
  Send,
  Loader2,
  Play,
  Pause,
  Scissors,
  MousePointer2,
  Upload,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Volume2,
  Eye,
  Gauge,
  Wand2,
  SkipBack,
  Download,
  Film,
  Images,
  Save,
  FolderOpen,
  Bot,
  Layers3,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
  MessageSquare,
  Workflow,
  ArrowRight,
  LogIn,
  ImageIcon,
} from "lucide-react";
import {
  AGENTS,
  TRACKS,
  TRACK_LABEL,
  agentById,
  type AgentAction,
  type TrackId,
} from "@/agent/lib/guy/agents";
import {
  IMAGE_ENGINES,
  VIDEO_ENGINES,
  DEFAULT_IMAGE_ENGINE,
  DEFAULT_VIDEO_ENGINE,
  CAMERA_MOVES,
  MOTION_CURVES,
  DEFAULT_MOTION,
  motionPhrase,
  FILTERS,
  PRESETS,
  type Motion,
} from "@/agent/lib/guy/engines";
import { generateImage, generateVideo } from "@/agent/lib/guy/generate";
import { renderTimeline, download } from "@/agent/lib/guy/export";
import { isDraftMode, setDraftMode } from "@/agent/lib/guy/generate";
import { LipSync } from "@/agent/components/guy/LipSync";
import { NodeCanvas } from "@/agent/components/guy/NodeCanvas";
import { LayerStudio } from "@/agent/components/guy/LayerStudio";
import { cn } from "@/lib/utils";
import { Terminal, vfxClass } from "@/agent/components/guy/Terminal";
import { Button } from "@/components/ui/button";
import { CreativeChat, DIRECTING_STYLES, type CrewRun } from "@/agent/components/guy/CreativeChat";
import { StudioCover } from "@/agent/components/guy/StudioCover";
import { EditPilot } from "@/agent/components/guy/EditPilot";
import { speak } from "@/agent/lib/guy/voice";
import { CreativeContext } from "@/agent/components/guy/CreativeContext";
import { withCreativeContext } from "@/agent/lib/guy/creative-context";
import { removeImageBackground } from "@/agent/lib/guy/remove-background";
import { readSse } from "@/agent/lib/guy/agent-stream";
import {
  clipForAsset,
  serializableAssets,
  type EditorAsset,
  type EditorClip,
  type SavedSession,
} from "@/agent/lib/guy/editor-state";
import scene1 from "@/agent/assets/guy/scene1.jpg";
import scene2 from "@/agent/assets/guy/scene2.jpg";
import scene3 from "@/agent/assets/guy/scene3.jpg";

export const Route = createFileRoute("/agent/studio")({
  head: () => ({
    meta: [
      { title: "GUI Video Studio — Creative editor" },
      {
        name: "description",
        content:
          "Create images and videos, direct your edit with AI, and preview every cut on your timeline.",
      },
      { property: "og:title", content: "GUI Video Studio — Creative editor" },
      {
        property: "og:description",
        content:
          "Create images and videos, direct your edit with AI, and preview every cut on your timeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Editor,
});

type Kind = "video" | "image" | "audio";
type Asset = EditorAsset;
type Clip = EditorClip;
type Msg = { role: "user" | "assistant"; text: string; steps?: string[]; agent?: string };

const uid = () => Math.random().toString(36).slice(2, 8);
const tc = (s: number) => {
  const f = Math.floor((s % 1) * 24);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
};

const GREETING: Msg = {
  role: "assistant",
  agent: "orchestrator",
  text: greetingText(""),
};

function Editor() {
  const [userName, setUserName] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const accountName = useRef("");
  function updateName(name: string) {
    const resolved = accountName.current || name.trim().slice(0, 80);
    setUserName(resolved);
    localStorage.setItem("reel-guest-name", name.slice(0, 80));
    setMsgs((previous) => previous.length === 1 && previous[0]?.role === "assistant" ? [{ ...GREETING, text: greetingText(resolved) }] : previous);
  }
  useEffect(() => {
    let active = true;
    const apply = (metadata?: Record<string, unknown>) => {
      if (!active) return;
      accountName.current = displayName(metadata);
      const name = displayName(metadata, localStorage.getItem("reel-guest-name") ?? "");
      setUserName(name);
      setMsgs((previous) => previous.length === 1 && previous[0]?.text === GREETING.text ? [{ ...GREETING, text: greetingText(name) }] : previous);
    };
    apply();
    void supabase.auth.getUser().then(({ data }) => { setSignedIn(!!data.user); apply(data.user?.user_metadata); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setSignedIn(!!session?.user); apply(session?.user.user_metadata); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(46);
  const [tool, setTool] = useState<"select" | "razor">("select");
  const [agentState, setAgent] = useState("orchestrator");
  const agent = agentState;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [directingStyle, setDirectingStyle] = useState("original");
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [mode, setMode] = useState<"start" | "edit" | "canvas" | "layers" | "workflows" | "creative" | "perform">("start");
  const [comfyFirst, setComfyFirst] = useState(false);
  const [imgEngine, setImgEngine] = useState(DEFAULT_IMAGE_ENGINE);
  const [vidEngine, setVidEngine] = useState(DEFAULT_VIDEO_ENGINE);
  const [resolution, setResolution] = useState("720p");
  const [motion, setMotion] = useState<Motion>(DEFAULT_MOTION);
  const [createTab, setCreateTab] = useState<"image" | "video">("image");
  const [firstFrame, setFirstFrame] = useState<File | null>(null);
  const [lastFrame, setLastFrame] = useState<File | null>(null);
  const [hoverT, setHoverT] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [draftMode, setDraft] = useState(false);
  useEffect(() => { setDraft(isDraftMode()); }, []);
  const [exportPct, setExportPct] = useState(0);
  const [mediaView, setMediaView] = useState<"media" | "generations">("media");
  const [panelTab, setPanelTab] = useState<"create" | "effects" | "media">("create");
  const [fxNote, setFxNote] = useState("");
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [sessionName, setSessionName] = useState("Untitled cut");
  const [crew, setCrew] = useState<CrewRun[]>([]);
  const [cutoutBusy, setCutoutBusy] = useState<string | null>(null);
  const [cutoutError, setCutoutError] = useState("");
  const laneRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const duration = useMemo(() => Math.max(12, ...clips.map((c) => c.start + c.dur)), [clips]);
  const assetOf = useCallback((id: string) => assets.find((a) => a.id === id), [assets]);
  const selected = clips.find((c) => c.id === sel) ?? null;

  const videoClip = useMemo(() => {
    for (const t of ["V3", "V2", "V1"] as TrackId[]) {
      const c = clips.find(
        (x) => x.track === t && playhead >= x.start && playhead < x.start + x.dur,
      );
      if (c && assetOf(c.assetId)?.kind !== "audio") return c;
    }
    return null;
  }, [clips, playhead, assetOf]);

  const audioClip = useMemo(
    () =>
      clips.find(
        (x) =>
          (x.track === "A1" || x.track === "A2") &&
          playhead >= x.start &&
          playhead < x.start + x.dur,
      ) ?? null,
    [clips, playhead],
  );

  // transport
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const d = (now - last) / 1000;
      last = now;
      setPlayhead((p) => {
        const next = p + d;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration]);

  // keep media elements in sync
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoClip) return;
    const want = sourceTime(videoClip, playhead);
    if (!playing || Math.abs(v.currentTime - want) > 0.3) v.currentTime = want;
    v.playbackRate = videoClip.speed;
    v.volume = videoClip.volume;
    if (playing) void v.play().catch(() => {});
    else v.pause();
  }, [playing, videoClip, playhead]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !audioClip) return;
    const want = sourceTime(audioClip, playhead);
    if (!playing || Math.abs(a.currentTime - want) > 0.3) a.currentTime = want;
    a.playbackRate = audioClip.speed;
    a.volume = audioClip.volume;
    if (playing) void a.play().catch(() => {});
    else a.pause();
  }, [playing, audioClip, playhead]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("reel-editor-sessions");
      if (stored) setSessions(JSON.parse(stored) as SavedSession[]);
    } catch {
      setSessions([]);
    }
    // Merge in cloud sessions when signed in (sync across devices).
    void listCloudSessions().then((cloud) => {
      if (!cloud.length) return;
      setSessions((local) => {
        const seen = new Set(cloud.map((c) => c.id));
        return [...cloud, ...local.filter((l) => !seen.has(l.id))].slice(0, 12);
      });
    });
  }, []);

  function newSession() {
    if (busy || genBusy || exporting) return;
    setAssets([]);
    setClips([]);
    setSel(null);
    setPlayhead(0);
    setPlaying(false);
    setMsgs([{ ...GREETING, text: greetingText(userName) }]);
    setBrief("");
    setCrew([]);
    setSessionName("Untitled cut");
    setAgent("orchestrator");
    setDirectingStyle("original");
    setMode("start");
  }

  function saveSession() {
    const session: SavedSession = {
      id: uid(),
      name: sessionName.trim() || "Untitled cut",
      updatedAt: new Date().toISOString(),
      assets: serializableAssets(assets),
      clips,
      messages: msgs,
      agent,
      imageEngine: imgEngine,
      videoEngine: vidEngine,
    };
    const next = [session, ...sessions].slice(0, 12);
    setSessions(next);
    window.localStorage.setItem("reel-editor-sessions", JSON.stringify(next));
    void syncSessionToCloud(session);
  }

  function openSession(id: string) {
    const session = sessions.find((item) => item.id === id);
    if (!session) return;
    setMode("edit");
    setPlaying(false);
    setCrew([]);
    setSessionName(session.name);
    setAssets(session.assets);
    setClips(session.clips);
    setMsgs(session.messages);
    setAgent(session.agent);
    setImgEngine(session.imageEngine);
    setVidEngine(session.videoEngine);
    setSel(null);
    setPlayhead(0);
  }

  /* ---------- media bin ---------- */
  async function ingest(files: FileList | null) {
    if (!files) return;
    const added: Asset[] = [];
    for (const f of Array.from(files)) {
      const kind: Kind = f.type.startsWith("video")
        ? "video"
        : f.type.startsWith("audio")
          ? "audio"
          : "image";
      const url = URL.createObjectURL(f);
      const dur = kind === "image" ? 4 : await probe(url, kind);
      added.push({ id: uid(), name: f.name, kind, url, dur });
    }
    setAssets((a) => [...a, ...added]);
    if (added.length) {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          agent,
          text: `Logged ${added.length} new ${added.length === 1 ? "file" : "files"} in the bin. Tell me the cut you're after.`,
          steps: added.map((a) => `Ingested ${a.name} · ${a.dur.toFixed(1)}s`),
        },
      ]);
    }
  }

  function probe(url: string, kind: Kind) {
    return new Promise<number>((res) => {
      const el = document.createElement(kind === "audio" ? "audio" : "video");
      el.preload = "metadata";
      el.onloadedmetadata = () => res(Number.isFinite(el.duration) ? el.duration : 5);
      el.onerror = () => res(5);
      el.src = url;
    });
  }

  function addToTimeline(asset: Asset, track?: TrackId) {
    setClips((cs) => {
      const clip = clipForAsset(asset, cs, uid());
      return [
        ...cs,
        track
          ? {
              ...clip,
              track,
              start: cs
                .filter((c) => c.track === track)
                .reduce((end, c) => Math.max(end, c.start + c.dur), 0),
            }
          : clip,
      ];
    });
  }

  async function generateBroll(override?: unknown) {
    const p = (typeof override === "string" ? override : brief).trim();
    if (!p || genBusy) return;
    setGenBusy(true);
    try {
      const url = await generateImage(p, imgEngine);
      const a: Asset = {
        id: uid(),
        name: `gen_${uid()}.png`,
        kind: "image",
        url,
        dur: 4,
        generated: true,
      };
      setAssets((x) => [...x, a]);
      addToTimeline(a, "V2");
      setMediaView("generations");
      void saveToCloudGallery(a, p);
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          agent,
          text: "Generated a b-roll plate and placed it in your gallery and V2.",
          steps: [`Generated "${p.slice(0, 48)}"`],
        },
      ]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          agent,
          text: `Couldn't generate that plate — ${e instanceof Error ? e.message : "the AI service didn't return an image."}`,
        },
      ]);
    } finally {
      setGenBusy(false);
    }
  }

  async function generateClip(override?: unknown) {
    const p = (typeof override === "string" ? override : brief).trim();
    if (!p || genBusy) return;
    setGenBusy(true);
    try {
      const url = await generateVideo(p, vidEngine, motionPhrase(motion), {
        resolution,
        image: firstFrame ?? undefined,
        lastFrame: lastFrame ?? undefined,
        onStatus: (s) =>
          setMsgs((m) => [
            ...m.slice(0, -1),
            { role: "assistant", agent, text: `Rendering video… ${s}` },
          ]),
      });
      const a: Asset = {
        id: uid(),
        name: `clip_${uid()}.mp4`,
        kind: "video",
        url,
        dur: 6,
        generated: true,
      };
      setAssets((x) => [...x, a]);
      addToTimeline(a, "V1");
      setMediaView("generations");
      void saveToCloudGallery(a, p);
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          agent,
          text: "Rendered a video clip and placed it in your gallery and timeline.",
          steps: [`Motion: ${motionPhrase(motion)}`],
        },
      ]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          agent,
          text: `Video render failed — ${e instanceof Error ? e.message : "unknown error"}`,
        },
      ]);
    } finally {
      setGenBusy(false);
    }
  }

  function addAsset(url: string, kind: "image" | "video", name: string, place = false) {
    const asset: Asset = {
      id: uid(),
      name,
      kind,
      url,
      dur: kind === "video" ? 6 : 4,
      generated: true,
    };
    setAssets((x) => [...x, asset]);
    if (place) addToTimeline(asset, kind === "image" ? "V2" : "V1");
    setMediaView("generations");
    void saveToCloudGallery(asset);
    setMsgs((m) => [
      ...m,
      {
        role: "assistant",
        agent,
        text: `${name} is now in Generations${place ? " and on the timeline" : ""}.`,
      },
    ]);
  }

  async function makeCutout(asset: Asset) {
    if (cutoutBusy || asset.kind !== "image") return;
    setCutoutBusy(asset.id);
    setCutoutError("");
    try {
      const url = await removeImageBackground(asset.url);
      addAsset(url, "image", `${asset.name.replace(/\.[^.]+$/, "")}_cutout.png`, true);
    } catch (error) {
      setCutoutError(error instanceof Error ? error.message : "Background removal failed.");
    } finally { setCutoutBusy(null); }
  }

  async function exportVideo() {
    if (!clips.length || exporting) return;
    setPlaying(false);
    setExporting(true);
    setExportPct(0);
    try {
      const blob = await renderTimeline(
        clips.map((c) => ({
          assetId: c.assetId,
          track: c.track,
          start: c.start,
          dur: c.dur,
          inPoint: c.inPoint,
          opacity: c.opacity,
          speed: c.speed,
          volume: c.volume,
          filterCss: FILTERS[c.filter] ?? "none",
        })),
        assets.map((a) => ({ id: a.id, kind: a.kind, url: a.url })),
        duration,
        setExportPct,
      );
      download(blob, blob.type.includes("mp4") ? "reel-edit.mp4" : "reel-edit.webm");
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          agent,
          text: `Exported your finished video (${blob.type.includes("mp4") ? "MP4" : "WebM"}) — check your downloads.`,
        },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          agent,
          text: "Export failed — your browser may not support recording. Try Chrome or Edge.",
        },
      ]);
    } finally {
      setExporting(false);
    }
  }

  /* ---------- timeline editing ---------- */
  function applyActions(actions: AgentAction[]) {
    setClips((cs) => {
      let next = [...cs];
      for (const a of actions) {
        if (a.op === "add") {
          const asset = assets.find((x) => x.id === a.assetId);
          if (!asset) continue;
          next.push({
            id: uid(),
            assetId: asset.id,
            track: a.track ?? "V1",
            start: Math.max(0, a.start ?? 0),
            dur: Math.max(0.3, a.dur ?? asset.dur),
            inPoint: 0,
            name: a.name ?? asset.name.replace(/\.[^.]+$/, ""),
            volume: 1,
            opacity: 1,
            speed: 1,
            filter: "none",
          });
        } else if (a.op === "remove") {
          next = next.filter((c) => c.id !== a.clipId);
        } else if (a.op === "trim") {
          next = next.map((c) => (c.id === a.clipId ? { ...c, dur: Math.max(0.3, a.dur) } : c));
        } else if (a.op === "move") {
          next = next.map((c) =>
            c.id === a.clipId
              ? { ...c, track: a.track ?? c.track, start: Math.max(0, a.start ?? c.start) }
              : c,
          );
        } else if (a.op === "split") {
          const c = next.find((x) => x.id === a.clipId);
          if (!c) continue;
          const off = Math.min(Math.max(0.2, a.at), c.dur - 0.2);
          next = next.flatMap((x) =>
            x.id !== c.id
              ? [x]
              : [
                  { ...x, dur: off },
                  {
                    ...x,
                    id: uid(),
                    start: x.start + off,
                    dur: x.dur - off,
                    inPoint: x.inPoint + off,
                  },
                ],
          );
        } else if (a.op === "set") {
          next = next.map((c) =>
            c.id === a.clipId
              ? {
                  ...c,
                  volume: a.volume ?? c.volume,
                  opacity: a.opacity ?? c.opacity,
                  speed: a.speed ?? c.speed,
                  filter: a.filter ?? c.filter,
                }
              : c,
          );
        }
      }
      return next;
    });
  }

  function splitAt(clip: Clip, at: number) {
    const off = at - clip.start;
    if (off <= 0.2 || off >= clip.dur - 0.2) return;
    setClips((cs) =>
      cs.flatMap((x) =>
        x.id !== clip.id
          ? [x]
          : [
              { ...x, dur: off },
              { ...x, id: uid(), start: x.start + off, dur: x.dur - off, inPoint: x.inPoint + off },
            ],
      ),
    );
  }

  function onClipPointerDown(e: React.PointerEvent, clip: Clip) {
    e.stopPropagation();
    const lane = laneRef.current;
    if (!lane) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offX = e.clientX - rect.left;
    if (tool === "razor") {
      splitAt(clip, clip.start + offX / zoom);
      return;
    }
    setSel(clip.id);
    const mode = offX < 10 ? "left" : offX > rect.width - 10 ? "right" : "move";
    const startClip = { ...clip };
    const originX = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const move = (ev: PointerEvent) => {
      const d = (ev.clientX - originX) / zoom;
      setClips((cs) =>
        cs.map((c) => {
          if (c.id !== clip.id) return c;
          if (mode === "move") return { ...c, start: Math.max(0, startClip.start + d) };
          if (mode === "left") {
            const delta = Math.min(Math.max(d, -startClip.start), startClip.dur - 0.3);
            return {
              ...c,
              start: startClip.start + delta,
              dur: startClip.dur - delta,
              inPoint: Math.max(0, startClip.inPoint + delta),
            };
          }
          return { ...c, dur: Math.max(0.3, startClip.dur + d) };
        }),
      );
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function scrub(e: React.PointerEvent) {
    const lane = laneRef.current;
    if (!lane) return;
    const seek = (clientX: number) => {
      const x = clientX - lane.getBoundingClientRect().left + lane.scrollLeft;
      setPlayhead(Math.min(duration, Math.max(0, x / zoom)));
    };
    seek(e.clientX);
    const move = (ev: PointerEvent) => seek(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  /* ---------- agent ---------- */
  /** Up to 4 image assets, shrunk to JPEG, so the brain can see them. */
  async function framesForBrain() {
    const imgs = assets.filter((a) => a.kind === "image").slice(-4);
    const out: { name: string; data: string; mime: "image/jpeg" }[] = [];
    for (const a of imgs) {
      try {
        const el = new Image();
        el.crossOrigin = "anonymous";
        await new Promise<void>((res, rej) => { el.onload = () => res(); el.onerror = () => rej(); el.src = a.url; });
        const scale = Math.min(1, 768 / Math.max(el.width, el.height));
        const c = document.createElement("canvas");
        c.width = Math.round(el.width * scale); c.height = Math.round(el.height * scale);
        c.getContext("2d")?.drawImage(el, 0, 0, c.width, c.height);
        out.push({ name: a.name, data: c.toDataURL("image/jpeg", 0.8).split(",")[1] ?? "", mime: "image/jpeg" });
      } catch { /* skip unreadable frame */ }
    }
    return out.filter((f) => f.data);
  }

  /** Brief to finished video: make each storyboard shot in order and line them up on V1. */
  async function buildStoryboard(shots: { kind: "image" | "video"; prompt: string; dur: number }[]) {
    setGenBusy(true);
    try {
      for (const [i, shot] of shots.entries()) {
        setMsgs((m) => [...m, { role: "assistant", agent: "orchestrator", text: `Making shot ${i + 1} of ${shots.length} (${shot.kind})…` }]);
        try {
          const url = shot.kind === "video"
            ? await generateVideo(shot.prompt, vidEngine, motionPhrase(motion), { resolution })
            : await generateImage(shot.prompt, imgEngine);
          const a: Asset = { id: uid(), name: `shot_${String(i + 1).padStart(2, "0")}.${shot.kind === "video" ? "mp4" : "png"}`, kind: shot.kind, url, dur: shot.dur, generated: true };
          setAssets((x) => [...x, a]);
          addToTimeline(a, "V1");
        } catch (e) {
          setMsgs((m) => [...m, { role: "assistant", agent: "orchestrator", text: `Shot ${i + 1} failed — ${e instanceof Error ? e.message : "unknown error"}. Moving on.` }]);
        }
      }
      setMediaView("generations");
      setMsgs((m) => [...m, { role: "assistant", agent: "orchestrator", text: `Storyboard done — shots are lined up in order on the timeline.` }]);
    } finally { setGenBusy(false); }
  }
  async function send(text: string, agentOverride?: string) {
    const t = text.trim();
    if (!t || busy) return;
    const intent = generationIntent(t);
    if (intent && !genBusy) {
      setBrief("");
      setMsgs((m) => [...m, { role: "user", text: t }, { role: "assistant", agent: agentOverride ?? agentState, text: intent === "video" ? "Rendering video… starting" : "Generating image…" }]);
      if (intent === "video") await generateClip(t);
      else await generateBroll(t);
      return;
    }
    const agent = agentOverride ?? agentState;
    setBrief("");
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setBusy(true);
    const isOrchestrator = agent === "orchestrator";
    if (isOrchestrator) {
      setCrew([]);
    }
    try {
      const images = await framesForBrain();
      const r = await fetch("/api/va/crew-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent,
          brief: withCreativeContext(`${t}\n\nDIRECTING STYLE: ${DIRECTING_STYLES.find((style) => style.id === directingStyle)?.brief ?? "Follow the user’s vision."}`),
          history: msgs.slice(-8).map((m) => ({ role: m.role, text: m.text })),
          images,
          assets: assets.map((a) => ({ id: a.id, name: a.name, kind: a.kind, dur: a.dur })),
          clips: clips.map((c) => ({
            id: c.id,
            assetId: c.assetId,
            track: c.track,
            start: c.start,
            dur: c.dur,
          })),
        }),
      });
      type Done = { reply: string; steps?: string[]; actions?: AgentAction[]; crew?: CrewRun[]; storyboard?: { kind: "image" | "video"; prompt: string; dur: number }[] };
      if (!r.ok || !r.body) {
        const e = (await r.json().catch(() => null)) as Done | null;
        throw new Error(e?.reply || "The creative crew could not respond.");
      }
      setMsgs((m) => [...m, { role: "assistant", agent, text: "" }]);
      const setLast = (patch: Partial<Msg>) =>
        setMsgs((m) => [...m.slice(0, -1), { ...m[m.length - 1]!, ...patch }]);
      let final: Done | null = null;
      let failed = false;
      await readSse(r.body, (event, data) => {
        if (event === "ping") return;
        const d = JSON.parse(data) as Done & { text?: string };
        if (event === "reply") {
          if (d.text) setLast({ text: d.text });
        } else if (event === "done" || event === "error") {
          final = d;
          failed = event === "error";
        }
      });
      const done = final as Done | null;
      if (!done) throw new Error("The creative crew lost connection. Please try again.");
      if (!failed && done.actions?.length) applyActions(done.actions);
      setLast({ text: done.reply, steps: done.steps ?? [] });
      if (isOrchestrator) setCrew(failed ? [] : (done.crew ?? []));
      if (!failed && done.storyboard?.length) void buildStoryboard(done.storyboard);
      if (!failed && voiceOn && "speechSynthesis" in window) {
        speak(done.reply);
      }
    } catch (error) {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          agent,
          text:
            error instanceof Error
              ? error.message
              : "I lost connection to the editing brain. Try that again.",
        },
      ]);
      if (isOrchestrator) setCrew((runs) => runs.map((run) => ({ ...run, status: "failed" })));
    } finally {
      setBusy(false);
    }
  }

  const active = agentById(agent);
  const previewAsset = videoClip ? assetOf(videoClip.assetId) : null;
  const audioAsset = audioClip ? assetOf(audioClip.assetId) : null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1800px] flex-col overflow-hidden border-border bg-background/65 font-sans text-foreground backdrop-blur-2xl sm:min-h-[calc(100vh-32px)] sm:rounded-xl sm:border sm:studio-frame lg:my-4">
      {/* side rail (was top bar) */}
      <header aria-label="Studio controls" className="studio-header sticky top-0 z-50 flex h-11 w-full shrink-0 flex-row items-center gap-2 overflow-x-auto border-b border-border bg-card/75 px-2 backdrop-blur-2xl [scrollbar-width:none]">
        <div className="flex shrink-0 flex-row items-center gap-1.5">
          <input
            aria-label="Session name"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="hidden w-32 rounded-md border border-border bg-transparent px-2 py-1 text-xs font-semibold outline-none focus:border-primary md:block"
          />
          <select
            aria-label="Open session"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) openSession(e.target.value);
              e.target.value = "";
            }}
            className="hidden max-w-36 rounded-md border border-border bg-background px-2 py-1.5 text-[11px] text-muted-foreground sm:block"
          >
            <option value="">Sessions · {sessions.length}</option>
            {sessions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="icon"
            onClick={newSession}
            disabled={busy || genBusy || exporting}
            title="New session"
            aria-label="New session"
          >
            <Plus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={saveSession}
            title="Save session"
            aria-label="Save session"
            className="grid size-8 place-items-center rounded-md border border-border glass-control text-muted-foreground transition hover:text-foreground"
          >
            <Save className="size-3.5" />
          </Button>
          
        </div>
        <div className="studio-header-tools flex shrink-0 flex-row items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            aria-pressed={voiceOn}
            aria-label={voiceOn ? "Mute voice replies" : "Turn on voice replies"}
            onClick={() => {
              if (voiceOn && typeof window !== "undefined") window.speechSynthesis?.cancel();
              setVoiceOn((v) => !v);
            }}
            className={cn("h-7 shrink-0 px-2 text-[11px]", voiceOn && "text-primary")}
          >
            <Volume2 className="size-3.5 sm:hidden" />
            <span className="hidden sm:inline">{voiceOn ? "Voice on" : "Voice off"}</span>
          </Button>
          <nav aria-label="Studio workspace" className="studio-mode-nav flex shrink-0 flex-row rounded-lg border border-border glass-control p-0.5 text-[11px]">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode("start")}
              aria-pressed={mode === "start"}
              className={cn("h-6 px-2", mode === "start" && "bg-primary/20 text-primary")}
            >
              <MessageSquare className="size-3" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setMode("edit")}
              aria-pressed={mode === "edit"}
              className={cn(
                "h-6 rounded-md px-2.5 py-1 transition",
                mode === "edit"
                  ? "bg-primary/20 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Clapperboard className="size-3 sm:hidden" />
              <span className="hidden sm:inline">Editor</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setMode("canvas")}
              aria-pressed={mode === "canvas"}
              className={cn(
                "h-6 rounded-md px-2.5 py-1 transition",
                mode === "canvas"
                  ? "bg-primary/20 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Film className="size-3 sm:hidden" />
              <span className="hidden sm:inline">Canvas</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setMode("layers")}
              aria-pressed={mode === "layers"}
              className={cn(
                "h-6 rounded-md px-2.5 py-1 transition",
                mode === "layers"
                  ? "bg-primary/20 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Layers3 className="size-3 sm:hidden" />
              <span className="hidden sm:inline">Layers</span>
            </Button>
            <Button variant="ghost" aria-label="Workflows" onClick={() => setMode("workflows")}
              className={cn("rounded-md px-2.5 py-1 transition", mode === "workflows" ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <Workflow className="size-3 sm:hidden" /><span className="hidden sm:inline">Workflows</span>
            </Button>
            <Button size="sm" variant="ghost" aria-label="Perform Anywhere" aria-pressed={mode === "perform"} onClick={() => setMode("perform")}><Film className="size-3" /><span className="hidden sm:inline">Perform</span></Button>
            <Button size="sm" variant="ghost" aria-label="Creative tools" aria-pressed={mode === "creative"} onClick={() => setMode("creative")}><Wand2 className="size-3" /><span className="hidden sm:inline">Tools</span></Button>
          </nav>
          <Button asChild size="sm" variant="ghost"><Link to="/agent/" aria-label="Visual settings"><Gauge className="size-3.5" /><span className="hidden sm:inline">Visual settings</span></Link></Button>
          {signedIn ? (
            <Button size="sm" variant="ghost" aria-label="Sign out" onClick={() => void supabase.auth.signOut()}>
              <LogIn className="size-3.5" /><span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : (
            <Button asChild size="sm" variant="ghost"><Link to="/" aria-label="Sign in"><LogIn className="size-3.5" /><span className="hidden sm:inline">Sign in</span></Link></Button>
          )}
          <LipSync onDone={(url) => addAsset(url, "video", "lip-sync.mp4", true)} />
          <ThemePicker />
          <Button
            variant="ghost"
            onClick={() => { const n = !draftMode; setDraftMode(n); setDraft(n); }}
            title="Draft mode: 4-second previews; Gemini Omni uses 360p"
            aria-pressed={draftMode}
            className={cn("flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-md border px-2 sm:px-2.5 text-xs font-bold", draftMode ? "border-primary text-primary" : "border-border text-muted-foreground")}
          >
            <Sparkles className="size-3.5" />
            <span className="hidden sm:inline">Draft {draftMode ? "on" : "off"}</span>
            <span className="sr-only">Draft mode {draftMode ? "on" : "off"}</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => void exportVideo()}
            disabled={exporting || !clips.length}
            className="flex size-8 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-2 py-1.5 text-xs font-bold text-primary-foreground transition hover:bg-accent disabled:opacity-40 sm:h-8 sm:w-auto sm:px-3"
          >
            {exporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            <span className="hidden sm:inline">{exporting ? `${Math.round(exportPct * 100)}%` : "Export"}</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setPickerOpen((o) => !o)}
            className="flex items-center gap-2 rounded-md border border-border glass-control px-2.5 py-1.5 text-xs transition hover:border-primary"
          >
            <ModelLogo hints={[active.name, active.model, active.provider]} className="size-5 rounded-full" />
            <span className="hidden font-medium sm:inline">{active.name}</span>
            <Sparkles className="size-3 text-muted-foreground" />
          </Button>
        </div>
      </header>
      <div className="flex min-w-0 flex-1 flex-col">
      <div className="hidden h-10 items-center gap-2 border-b border-border px-4 text-xs lg:flex">
        <span className="font-semibold">{sessionName}</span>
        <span className="text-muted-foreground">· {busy ? "Brain working…" : genBusy ? "Generating…" : "Ready"}</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">{clips.length} clips · {assets.length} media</span>
      </div>

      {pickerOpen && (
        <div className="animate-rise border-b border-border glass-panel p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Choose your co-editor
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {AGENTS.map((a) => (
              <Button
                variant="ghost"
                key={a.id}
                disabled={!a.available}
                onClick={() => {
                  setAgent(a.id);
                  setPickerOpen(false);
                  setMsgs((m) => [
                    ...m,
                    {
                      role: "assistant",
                      agent: a.id,
                      text: `${a.name} here — ${a.role.toLowerCase()}. Where do you want to take this cut?`,
                    },
                  ]);
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition",
                  a.id === agent
                    ? "border-primary bg-primary/10"
                    : "border-border glass-control hover:border-muted-foreground",
                  !a.available && "opacity-40",
                )}
              >
                <ModelLogo hints={[a.name, a.model, a.provider]} className="size-7 rounded-lg" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">{a.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {a.available ? a.role : "Not available here yet"}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <Terminal
        busy={busy || genBusy}
        clipCount={clips.length}
        onAsk={(id, task) => { setAgent(id); void send(task, id); }}
        onVfx={(id) => {
          const pr = PRESETS.find((x) => x.id === id || x.label.toLowerCase().replace(/\s/g, "") === id);
          if (!pr) return `Unknown effect "${id}". Try: ${PRESETS.map((x) => x.id).join(", ")}`;
          const target = videoClip ?? clips.find((c) => c.track.startsWith("V"));
          if (!target) return "No clip on the timeline yet — add media first.";
          setClips((cs) => cs.map((c) => c.id === target.id ? { ...c, filter: pr.filter ?? c.filter, speed: pr.speed ?? c.speed, opacity: pr.opacity ?? c.opacity } : c));
          setSel(target.id);
          return `${pr.label} applied to ${target.name}.`;
        }}
        onGenerate={async (kind, prompt) => {
          if (genBusy) return "A generation is already running.";
          setGenBusy(true);
          setMode("edit");
          try {
            const url = kind === "video" ? await generateVideo(prompt, vidEngine, motionPhrase(motion), { resolution }) : await generateImage(prompt, imgEngine);
            const name = `cli_${uid()}.${kind === "video" ? "mp4" : "png"}`;
            addAsset(url, kind, name, true);
            return `✓ ${name} ready — in Generations and on the timeline.`;
          } catch (e) { return `✗ ${kind} failed: ${e instanceof Error ? e.message : "unknown error"}`; }
          finally { setGenBusy(false); }
        }}
        onSplit={() => { const t = videoClip; if (!t) return "No clip under the playhead."; splitAt(t, playhead); return `Split ${t.name} at ${playhead.toFixed(2)}s.`; }}
        onExport={() => { void exportVideo(); }}
        onMode={(m) => setMode(m)}
      />
      {mode === "start" ? (
        <StudioCover
          onWorkspace={() => setMode("edit")}
          userName={userName}
          onName={updateName}
          onNew={newSession}
          onMode={setMode}
          onIdea={(idea) => {
            setBrief(idea);
            document.getElementById("creative-start")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <CreativeChat messages={msgs} brief={brief} setBrief={setBrief} busy={busy} send={send} onAttach={(f) => void ingest(f)} references={assets.map((a) => a.name)} spacious />
          <div className="mt-5"><CreativeContext /></div>
          <div className="my-5 flex flex-wrap items-center gap-2">
            <label htmlFor="directing-style" className="mr-1 text-xs text-muted-foreground">Direction</label>
            <select
              id="directing-style"
              aria-label="Directing style"
              value={directingStyle}
              onChange={(e) => setDirectingStyle(e.target.value)}
              className="rounded-md border border-border bg-card px-3 py-2 text-xs"
            >
              {DIRECTING_STYLES.map((style) => (
                <option key={style.id} value={style.id}>{style.label}</option>
              ))}
            </select>
          </div>
        </StudioCover>
      ) : mode === "perform" ? (
        <PerformStudio onAsset={addAsset} />
      ) : mode === "creative" ? (
        <CreativeTools initialTab={comfyFirst ? "comfy" : "moodboards"} onAsset={addAsset} onPerform={() => setMode("perform")} onCanvas={() => setMode("canvas")} onLayers={() => setMode("layers")} onWorkflows={() => setMode("workflows")} onAsk={(task) => { setMode("start"); setAgent("orchestrator"); setBrief(task); }} />
      ) : mode === "canvas" ? (
        <main className="grid flex-1 gap-2 p-2 sm:p-3 lg:grid-cols-[minmax(0,1fr)_340px]">
          <NodeCanvas motion={motion} onAsset={addAsset} />
          <aside aria-label="Canvas agent" className="flex flex-col gap-3 rounded-lg border border-border glass-panel p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold"><Bot className="size-3.5 text-accent" /> Canvas agent</p>
            <p className="text-[11px] text-muted-foreground">Ask for shots, looks or a full sequence. It sees your images and sends results to Generations and the timeline.</p>
            <CreativeChat messages={msgs} brief={brief} setBrief={setBrief} busy={busy} send={(t) => send(t, "orchestrator")} onAttach={(f) => void ingest(f)} references={assets.map((a) => a.name)} />
          </aside>
        </main>
      ) : mode === "workflows" ? (
        <main className="flex-1 p-2 sm:p-3">
          <WorkflowStudio assets={assets} clips={clips} onAsset={addAsset} onComfy={() => { setComfyFirst(true); setMode("creative"); }} />
        </main>
      ) : mode === "layers" ? (
        <main className="flex-1 p-2 sm:p-3">
          <LayerStudio onAsset={addAsset} />
        </main>
      ) : (
        <main className="editor-workspace grid min-w-0 flex-1 gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* monitor + timeline */}
          <section aria-label="Preview and timeline" className="flex min-w-0 flex-col gap-3">
            <div className="overflow-hidden rounded-lg border border-border glass-panel">
              <div aria-label="Video preview" className="relative grid aspect-video place-items-center bg-background">
                {previewAsset && videoClip ? (
                  previewAsset.kind === "video" ? (
                    <video
                      ref={videoRef}
                      key={videoClip.id}
                      src={previewAsset.url}
                      playsInline
                      className="h-full w-full object-contain"
                      style={{
                        filter: FILTERS[videoClip.filter] ?? "none",
                        opacity: videoClip.opacity,
                      }}
                    />
                  ) : (
                    <img
                      src={previewAsset.url}
                      alt=""
                      className="h-full w-full object-contain"
                      style={{
                        filter: FILTERS[videoClip.filter] ?? "none",
                        opacity: videoClip.opacity,
                      }}
                    />
                  )
                ) : (
                  <p className="font-mono text-xs text-muted-foreground">
                    {clips.length ? "No clip under the playhead" : "Your canvas is empty"}
                  </p>
                )}
                {videoClip && videoClip.filter !== "none" && <div aria-hidden className={vfxClass(videoClip.filter)} />}
                {audioAsset && (
                  <audio
                    ref={audioRef}
                    key={audioClip?.id}
                    src={audioAsset.url}
                    className="hidden"
                  />
                )}
              </div>
              <div className="flex items-center gap-3 border-t border-border px-3 py-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPlaying(false);
                    setPlayhead(0);
                  }}
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  <SkipBack className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  aria-label={playing ? "Pause preview" : "Play preview"}
                  onClick={() => setPlaying((p) => !p)}
                  className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"
                >
                  {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                </Button>
                <span className="font-mono text-xs text-primary">{tc(playhead)}</span>
                <span className="font-mono text-xs text-muted-foreground">/ {tc(duration)}</span>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    onClick={() => setTool("select")}
                    className={cn(
                      "grid size-7 place-items-center rounded transition",
                      tool === "select"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <MousePointer2 className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setTool("razor")}
                    className={cn(
                      "grid size-7 place-items-center rounded transition",
                      tool === "razor"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <Scissors className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setZoom((z) => Math.max(18, z - 10))}
                    className="grid size-7 place-items-center rounded text-muted-foreground transition hover:bg-secondary"
                  >
                    <ZoomOut className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setZoom((z) => Math.min(160, z + 10))}
                    className="grid size-7 place-items-center rounded text-muted-foreground transition hover:bg-secondary"
                  >
                    <ZoomIn className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="editor-cockpit">
            {/* timeline */}
            <div aria-label="Timeline" className="flex min-h-[248px] min-w-0 overflow-hidden rounded-lg border border-border glass-panel">
              <div className="w-16 shrink-0 border-r border-border">
                <div className="h-6 border-b border-border" />
                {TRACKS.map((t) => (
                  <div
                    key={t}
                    title={TRACK_LABEL[t]}
                    className="flex h-11 items-center justify-center border-b border-border font-mono text-[10px] text-muted-foreground"
                  >
                    {t}
                  </div>
                ))}
              </div>
              <div className="relative flex-1 overflow-x-auto" ref={laneRef}>
                <div
                  style={{ width: Math.max(duration + 6, 20) * zoom }}
                  className="relative"
                  onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHoverT(Math.max(0, (e.clientX - r.left) / zoom)); }}
                  onPointerLeave={() => setHoverT(null)}
                >
                  <div
                    onPointerDown={scrub}
                    aria-label="Timeline ruler"
                    className="sticky top-0 z-20 h-6 cursor-col-resize border-b border-border bg-card"
                  >
                    {Array.from({ length: Math.ceil(duration) + 6 }).map((_, i) => (
                      <span
                        key={i}
                        className="absolute top-0 h-full border-l border-border/60 pl-1 font-mono text-[9px] leading-6 text-muted-foreground"
                        style={{ left: i * zoom }}
                      >
                        {i % 2 === 0 ? `${i}s` : ""}
                      </span>
                    ))}
                  </div>
                  {TRACKS.map((t) => (
                    <div
                      key={t}
                      className="relative h-11 border-b border-border"
                      onPointerDown={() => setSel(null)}
                    >
                      {clips
                        .filter((c) => c.track === t)
                        .map((c) => {
                          const a = assetOf(c.assetId);
                          const isAudio = t === "A1" || t === "A2";
                          return (
                            <div
                              key={c.id}
                              onPointerDown={(e) => onClipPointerDown(e, c)}
                              className={cn(
                                "absolute top-1 flex h-9 items-center overflow-hidden rounded-md border text-[10px] select-none",
                                sel === c.id
                                  ? "border-primary ring-1 ring-primary"
                                  : "border-border",
                                tool === "razor" ? "cursor-crosshair" : "cursor-grab",
                              )}
                              style={{
                                left: c.start * zoom,
                                width: Math.max(12, c.dur * zoom),
                                background: isAudio
                                  ? "color-mix(in oklab, var(--chart-4) 28%, var(--card))"
                                  : "color-mix(in oklab, var(--chart-2) 26%, var(--card))",
                              }}
                            >
                              <span className="absolute inset-y-0 left-0 w-2 cursor-ew-resize bg-foreground/10" />
                              {a && !isAudio && a.kind === "image" && (
                                <img
                                  src={a.url}
                                  alt=""
                                  className="h-full w-10 shrink-0 object-cover opacity-70"
                                />
                              )}
                              <span className="truncate px-1.5 font-mono">{c.name}</span>
                              <span className="absolute inset-y-0 right-0 w-2 cursor-ew-resize bg-foreground/10" />
                            </div>
                          );
                        })}
                    </div>
                  ))}
                  <div
                    className="pointer-events-none absolute top-0 bottom-0 z-30 w-px bg-primary"
                    style={{ left: playhead * zoom }}
                  >
                    <span className="absolute -top-0 -left-1 size-2 rotate-45 bg-primary" />
                  </div>
                  {hoverT !== null && (() => {
                    const hc = (["V3", "V2", "V1"] as TrackId[]).map((track) => clips.find((x) => x.track === track && hoverT >= x.start && hoverT < x.start + x.dur)).find(Boolean);
                    const ha = hc ? assetOf(hc.assetId) : undefined;
                    return (
                      <div className="pointer-events-none absolute top-7 z-40 w-32 -translate-x-1/2 overflow-hidden rounded-md border border-primary glass-panel" style={{ left: hoverT * zoom }} aria-label="Scrub preview">
                        <div className="grid aspect-video place-items-center bg-muted">
                          {ha?.kind === "image" && <img src={ha.url} alt="" className="h-full w-full object-cover" />}
                          {ha?.kind === "video" && hc && <TimelineHoverPreview url={ha.url} time={sourceTime(hc, hoverT)} />}
                          {!ha && <span className="text-[9px] text-muted-foreground">Empty</span>}
                        </div>
                        <p className="px-1 py-0.5 text-center font-mono text-[9px] text-primary">{tc(hoverT)}</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
            <aside aria-label="Editing chat" className="flex min-w-0 flex-col gap-3 border-t border-border pt-3 xl:border-t-0 xl:border-l xl:pl-3 xl:pt-0">
              <EditPilot busy={busy} onAsk={(task) => void send(task, "orchestrator")} brief={brief} onOptimize={setBrief} />
              <CreativeChat messages={msgs} brief={brief} setBrief={setBrief} busy={busy} send={send} onAttach={(f) => void ingest(f)} references={assets.map((a) => a.name)} />
              <details><summary className="cursor-pointer text-xs text-muted-foreground">Creative context</summary><div className="pt-3"><CreativeContext /></div></details>
            </aside>
            </div>
          </section>

          <aside aria-label="Create Effects Media" className="flex min-w-0 flex-col gap-3 border-t border-border pt-3 lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0">
            <div role="tablist" aria-label="Editor tools" className="grid grid-cols-3 gap-1 border-b border-border pb-3">
              {(["create", "effects", "media"] as const).map((tab) => <Button key={tab} variant="ghost" role="tab" aria-selected={panelTab === tab} onClick={() => setPanelTab(tab)} className={cn("h-8 px-1 text-xs capitalize", panelTab === tab ? "bg-secondary text-foreground" : "text-muted-foreground")}>{tab}</Button>)}
            </div>
            {panelTab === "create" && <div className="space-y-3">            <div role="tablist" aria-label="Create" className="grid grid-cols-2 gap-1 rounded-md glass-control p-1">
              {(["image", "video"] as const).map((t) => (
                <Button variant="ghost" key={t} role="tab" aria-selected={createTab === t} type="button" onClick={() => setCreateTab(t)}
                  className={cn("rounded py-1.5 text-[11px] font-semibold capitalize", createTab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                  {t}
                </Button>
              ))}
            </div>
            {createTab === "image" && <div className="space-y-2 rounded-md border border-accent/40 bg-accent/5 p-2">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-accent"><ImageIcon className="size-3" /> Image creation</p>
              <label className="block text-[10px] text-muted-foreground">
                 Image model
                <span className="mt-1 flex items-center gap-2">
                <ModelLogo hints={[IMAGE_ENGINES.find((x) => x.id === imgEngine)?.name, IMAGE_ENGINES.find((x) => x.id === imgEngine)?.model ?? "gpt"]} className="size-8" />
                <select
                  aria-label="Image model"
                  value={imgEngine}
                  onChange={(e) => setImgEngine(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2 py-2 text-[11px]"
                >
                  {IMAGE_ENGINES.map((en) => (
                    <option key={en.id} value={en.id} disabled={!en.available}>
                      {en.name}
                       {!en.available ? " · Not connected" : ""}
                    </option>
                  ))}
                </select>
                </span>
              </label>
              <Button
                variant="ghost"
                onClick={() => void generateBroll()}
                disabled={genBusy || !brief.trim()}
                className="flex w-full items-center justify-center gap-1 rounded-md glass-control py-2 text-[10px] font-bold disabled:opacity-50"
              >
                <Wand2 className="size-3" /> Create image
              </Button>
            </div>}
            {createTab === "video" && <div className="space-y-2 rounded-md border border-primary/40 bg-primary/5 p-2">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-primary"><Clapperboard className="size-3" /> Video creation</p>
              <label className="block text-[10px] text-muted-foreground">
                Video model
                <span className="mt-1 flex items-center gap-2">
                <ModelLogo hints={[VIDEO_ENGINES.find((x) => x.id === vidEngine)?.name, VIDEO_ENGINES.find((x) => x.id === vidEngine)?.model ?? "veo"]} className="size-8" />
                <select
                  aria-label="Video model"
                  value={vidEngine}
                  onChange={(e) => setVidEngine(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2 py-2 text-[11px]"
                >
                  {VIDEO_ENGINES.map((en) => (
                    <option key={en.id} value={en.id} disabled={!en.available}>
                      {en.name}
                      {!en.available ? " · Not connected" : ""}
                    </option>
                  ))}
                </select>
                </span>
              </label>
              <label className="block text-[10px] text-muted-foreground">
                Video resolution
                <select
                  aria-label="Video resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-[11px]"
                >
                  <option value="480p">480p · fastest</option>
                  <option value="720p">720p · HD</option>
                  <option value="1080p">1080p · Full HD</option>
                  <option value="4k">4K · renders at 1080p on current models</option>
                </select>
              </label>
              <p className="pt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Motion control
              </p>
              <select
                aria-label="Camera motion"
                value={motion.move}
                onChange={(e) => setMotion((m) => ({ ...m, move: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-[11px]"
              >
                {CAMERA_MOVES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <Slider
                icon={<Gauge className="size-3" />}
                label="Intensity"
                value={motion.intensity}
                min={1}
                max={10}
                step={1}
                onChange={(v) => setMotion((m) => ({ ...m, intensity: v }))}
              />
              <div className="flex gap-1.5">
                <select
                  value={motion.curve}
                  onChange={(e) => setMotion((m) => ({ ...m, curve: e.target.value }))}
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-[11px]"
                >
                  {MOTION_CURVES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <select
                  value={motion.fps}
                  onChange={(e) => setMotion((m) => ({ ...m, fps: Number(e.target.value) }))}
                  className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-[11px]"
                >
                  {[24, 30, 60].map((f) => (
                    <option key={f} value={f}>
                      {f}fps
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {([["First frame", firstFrame, setFirstFrame], ["Last frame", lastFrame, setLastFrame]] as const).map(([label, f, set]) => (
                  <label key={label} className="cursor-pointer rounded-md border border-dashed border-border p-1.5 text-center text-[10px] text-muted-foreground hover:border-primary">
                    {f ? `✓ ${f.name.slice(0, 14)}` : label}
                    <input type="file" accept="image/*" className="hidden" aria-label={label} onChange={(e) => set(e.target.files?.[0] ?? null)} />
                  </label>
                ))}
              </div>
              <Button
                variant="ghost"
                onClick={() => void generateClip()}
                disabled={genBusy || !brief.trim()}
                className="flex w-full items-center justify-center gap-1 rounded-md bg-primary py-2 text-[10px] font-bold text-primary-foreground disabled:opacity-50"
              >
                {genBusy ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Film className="size-3" />
                )}{" "}
                Create video
              </Button>
            </div>}
</div>}
            {panelTab === "media" && <div className="space-y-3">            <div className="flex items-center justify-between">
              <div className="flex rounded-md border border-border glass-control p-0.5">
                <Button
                  variant="ghost"
                  onClick={() => setMediaView("media")}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold",
                    mediaView === "media" ? "bg-primary/20 text-primary" : "text-muted-foreground",
                  )}
                >
                  <FolderOpen className="size-3" /> Media
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setMediaView("generations")}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold",
                    mediaView === "generations"
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <Images className="size-3" /> Generations
                </Button>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {mediaView === "media"
                  ? assets.length
                  : assets.filter((item) => item.generated).length}
              </span>
            </div>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void ingest(e.dataTransfer.files);
              }}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border glass-control py-4 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground"
            >
              <Upload className="size-3.5" /> Import from gallery
              <input
                aria-label="Import media"
                type="file"
                multiple
                accept="video/*,audio/*,image/*"
                className="hidden"
                onChange={(e) => void ingest(e.target.files)}
              />
            </label>
            <div className="grid max-h-[300px] grid-cols-2 gap-2 overflow-y-auto lg:max-h-none">
              {assets
                .filter((item) => mediaView === "media" || item.generated)
                .map((a) => (
                  <div
                    key={a.id}
                    className="group overflow-hidden rounded-md border border-border glass-control transition hover:border-primary/50"
                  >
                    <div className="grid aspect-video w-full place-items-center overflow-hidden bg-muted">
                      {a.kind === "audio" ? (
                        <Volume2 className="size-4 text-muted-foreground" />
                      ) : a.kind === "video" ? (
                        <video src={a.url} muted className="h-full w-full object-cover" />
                      ) : (
                        <img src={a.url} alt={a.name} className="transparency-grid h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 p-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium">{a.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {a.dur.toFixed(1)}s · {a.kind}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => addToTimeline(a)}
                        title="Add to timeline"
                        className="grid size-6 shrink-0 place-items-center rounded bg-secondary text-muted-foreground transition hover:bg-primary hover:text-primary-foreground"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                      {a.kind === "image" && <Button variant="ghost" size="icon" className="size-6 shrink-0" aria-label={`Remove background from ${a.name}`} title="Remove background" disabled={!!cutoutBusy} onClick={() => void makeCutout(a)}>{cutoutBusy === a.id ? <Loader2 className="size-3 animate-spin" /> : <Scissors className="size-3" />}</Button>}
                    </div>
                  </div>
                ))}
              {mediaView === "media" && !assets.length && (
                <p className="col-span-2 py-8 text-center text-[11px] text-muted-foreground">
                  No media yet.
                </p>
              )}
              {mediaView === "generations" && !assets.some((item) => item.generated) && (
                <p className="col-span-2 py-8 text-center text-[11px] text-muted-foreground">
                  Your generated images and videos will appear here.
                </p>
              )}
            </div>
            {cutoutError && <p role="alert" className="text-xs text-destructive">{cutoutError}</p>}
</div>}
            {panelTab === "effects" && (selected ? (
              <div className="space-y-3 text-xs">
                <p className="truncate font-semibold">{selected.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {selected.track} · {tc(selected.start)} → {tc(selected.start + selected.dur)}
                </p>
                <Slider
                  icon={<Volume2 className="size-3" />}
                  label="Volume"
                  value={selected.volume}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) =>
                    setClips((cs) =>
                      cs.map((c) => (c.id === selected.id ? { ...c, volume: v } : c)),
                    )
                  }
                />
                <Slider
                  icon={<Eye className="size-3" />}
                  label="Opacity"
                  value={selected.opacity}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onChange={(v) =>
                    setClips((cs) =>
                      cs.map((c) => (c.id === selected.id ? { ...c, opacity: v } : c)),
                    )
                  }
                />
                <Slider
                  icon={<Gauge className="size-3" />}
                  label="Speed"
                  value={selected.speed}
                  min={0.25}
                  max={2}
                  step={0.05}
                  onChange={(v) =>
                    setClips((cs) => cs.map((c) => (c.id === selected.id ? { ...c, speed: v } : c)))
                  }
                />
                <div>
                  <p className="mb-1 text-[10px] text-muted-foreground">Look</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(FILTERS).map((f) => (
                      <Button
                        variant="ghost"
                        key={f}
                        onClick={() =>
                          setClips((cs) =>
                            cs.map((c) => (c.id === selected.id ? { ...c, filter: f } : c)),
                          )
                        }
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] capitalize transition",
                          selected.filter === f
                            ? "border-primary text-primary"
                            : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {f}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[10px] text-muted-foreground">Effect presets</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map((p) => (
                      <Button
                        variant="ghost"
                        key={p.id}
                        title={p.hint}
                        onClick={() =>
                          setClips((cs) =>
                            cs.map((c) =>
                              c.id === selected.id
                                ? {
                                    ...c,
                                    filter: p.filter ?? c.filter,
                                    speed: p.speed ?? c.speed,
                                    opacity: p.opacity ?? c.opacity,
                                  }
                                : c,
                            ),
                          )
                        }
                        className="group h-auto flex-col items-stretch overflow-hidden rounded-md border border-border p-0 text-left text-[10px] text-muted-foreground transition hover:border-primary hover:text-foreground"
                      >
                        <EffectPreview preset={p} source={assets.find((a) => a.id === selected.assetId && a.kind === "video")?.url} />
                        <span className="block px-1.5 py-1 font-bold">{p.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => splitAt(selected, playhead)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-secondary py-1.5 text-[11px] transition hover:bg-muted"
                  >
                    <Scissors className="size-3" /> Split
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setClips((cs) => cs.filter((c) => c.id !== selected.id));
                      setSel(null);
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg bg-secondary px-2 py-1.5 text-[11px] text-destructive transition hover:bg-muted"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <p className="text-[10px] text-muted-foreground">VFX & presets — applies to the clip under the playhead, or your first clip.</p>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((p) => (
                    <Button variant="ghost" key={p.id} title={p.hint} onClick={() => {
                      const target = videoClip ?? clips.find((c) => c.track.startsWith("V"));
                      if (!target) { setFxNote("Add a clip to the timeline first, then pick an effect."); return; }
                      setClips((cs) => cs.map((c) => c.id === target.id ? { ...c, filter: p.filter ?? c.filter, speed: p.speed ?? c.speed, opacity: p.opacity ?? c.opacity } : c));
                      setSel(target.id);
                      setFxNote(`${p.label} applied to ${target.name}.`);
                    }} className="h-auto flex-col items-stretch overflow-hidden rounded-md border border-border p-0 text-left text-[10px] text-muted-foreground transition hover:border-primary hover:text-foreground">
                      <EffectPreview preset={p} source={assets.find((a) => a.id === videoClip?.assetId && a.kind === "video")?.url} />
                      <span className="block px-1.5 py-1 font-bold">{p.label}</span>
                    </Button>
                  ))}
                </div>
                {fxNote && <p role="status" className="text-[11px] text-primary">{fxNote}</p>}
              </div>
            ))}
          </aside>
        </main>
      )}
      </div>
    </div>
  );
}

function Slider({
  icon,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        {icon}
        {label}
        <span className="ml-auto font-mono">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--primary)]"
      />
    </label>
  );
}
