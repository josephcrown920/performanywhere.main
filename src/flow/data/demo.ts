import heroFrame from "@/flow/assets/hero.jpg";
import frameWide from "@/flow/assets/frame-wide.jpg";
import framePortrait from "@/flow/assets/frame-portrait.jpg";
import frameAction from "@/flow/assets/frame-action.jpg";
import frameInterior from "@/flow/assets/frame-interior.jpg";
import charKira from "@/flow/assets/char-kira.jpg";
import charEcho from "@/flow/assets/char-echo.jpg";
import charMeridian from "@/flow/assets/char-meridian.jpg";

export type FrameKey = "hero" | "wide" | "portrait" | "action" | "interior";
export type Tint = "violet" | "cyan" | "magenta" | "amber" | "none";

export const FRAME_IMAGES: Record<FrameKey, string> = {
  hero: heroFrame,
  wide: frameWide,
  portrait: framePortrait,
  action: frameAction,
  interior: frameInterior,
};

export type Shot = {
  id: string;
  scene: string;
  number: string;
  title: string;
  description: string;
  camera: string;
  duration: string;
  frame: FrameKey;
  tint: Tint;
  status: "preview" | "ready";
};

export type Character = {
  id: string;
  name: string;
  role: string;
  description: string;
  tags: string[];
  portrait: string;
  tint: Tint;
};

export type CanvasNode = {
  id: string;
  kind: "script" | "shot" | "character" | "image";
  title: string;
  subtitle: string;
  x: number;
  y: number;
  frame?: FrameKey;
  /** Generated / edited image (data URL) shown instead of the demo frame. */
  imageUrl?: string;
  prompt?: string;
  /** Character ids locked for face consistency. */
  lock?: string[];
};

export type CanvasLink = { id: string; from: string; to: string };

export const DEMO_PROJECT = {
  title: "Neon Requiem",
  logline:
    "In a city where memories are streamed as holograms, a burnt-out memory detective hunts the ghost of a woman who never existed.",
  stylePreset: "Prismatic Noir",
};

export const DEMO_SHOTS: Shot[] = [
  {
    id: "shot-1",
    scene: "SC 01",
    number: "1",
    title: "The Ghost Above the City",
    description:
      "Cold open. KIRA stands on a rain-slick rooftop, dwarfed by a colossal holographic face rippling over the skyline. The hologram mouths her name.",
    camera: "Slow crane down from rooftop wide",
    duration: "8s",
    frame: "hero",
    tint: "violet",
    status: "ready",
  },
  {
    id: "shot-2",
    scene: "SC 01",
    number: "2",
    title: "Memory Leak",
    description:
      "Close on KIRA. Holographic data streams slide across her eyes. A reflection of the woman who never existed flickers in her pupil.",
    camera: "Push in, rack focus to eyes",
    duration: "4s",
    frame: "portrait",
    tint: "none",
    status: "ready",
  },
  {
    id: "shot-3",
    scene: "SC 02",
    number: "3",
    title: "Vendor Row",
    description:
      "KIRA moves through a crowded memory-bazaar street under prismatic signage. Ads track her with her own stolen memories.",
    camera: "Steadicam follow, low angle",
    duration: "6s",
    frame: "wide",
    tint: "none",
    status: "ready",
  },
  {
    id: "shot-4",
    scene: "SC 02",
    number: "4",
    title: "Ghost in the Crowd",
    description:
      "KIRA freezes — ECHO watches her from a doorway, cybernetic hand crackling. He turns and vanishes into the crowd.",
    camera: "Whip pan to ECHO, then handheld pursuit",
    duration: "3s",
    frame: "wide",
    tint: "cyan",
    status: "ready",
  },
  {
    id: "shot-5",
    scene: "SC 03",
    number: "5",
    title: "The Interrogation",
    description:
      "A memory-clinic interrogation room. KIRA sits beneath a single projection beam as MERIDIAN's memory replay blooms above the table.",
    camera: "Static, symmetrical medium wide",
    duration: "7s",
    frame: "interior",
    tint: "violet",
    status: "ready",
  },
  {
    id: "shot-6",
    scene: "SC 03",
    number: "6",
    title: "Signal Spike",
    description:
      "The replay corrupts. Reality glitches — walls fragment into spectrum shards. KIRA fights the feedback burning through her implant.",
    camera: "Handheld shake, 45° dutch angle",
    duration: "4s",
    frame: "action",
    tint: "magenta",
    status: "ready",
  },
  {
    id: "shot-7",
    scene: "SC 04",
    number: "7",
    title: "Skyline Chase",
    description:
      "Hovercar pursuit through a canyon of holographic billboards. ECHO pilots; MERIDIAN's face splits every screen they pass.",
    camera: "Fast lateral track, 120fps speed ramp",
    duration: "5s",
    frame: "action",
    tint: "none",
    status: "ready",
  },
  {
    id: "shot-8",
    scene: "SC 04",
    number: "8",
    title: "Requiem",
    description:
      "The hologram woman finally speaks with MERIDIAN's voice: 'You made me to forget her.' KIRA lowers her weapon as the light dissolves.",
    camera: "Slow pull out to widescreen silhouette",
    duration: "9s",
    frame: "hero",
    tint: "magenta",
    status: "ready",
  },
];

export const DEMO_CHARACTERS: Character[] = [
  {
    id: "char-kira",
    name: "Kira Voss",
    role: "Memory Detective",
    description:
      "Burnt-out ex-corporate retriever. Filters her memories to survive the case — every use bleaches a little more of her past. Wears a tech-noir trench coat with holographic HUD reflections.",
    tags: ["Lead", "Prismatic Noir wardrobe", "Violet key light", "consistency-v3"],
    portrait: charKira,
    tint: "violet",
  },
  {
    id: "char-echo",
    name: "Echo",
    role: "Signal Broker",
    description:
      "Street-level data courier with a glowing cybernetic right hand and wire-frame lenses. Sells other people's memories; keeps none of his own. Never directly lit — always caught in neon spill.",
    tags: ["Support", "Neon-teal palette", "Cybernetic hand", "consistency-v3"],
    portrait: charEcho,
    tint: "cyan",
  },
  {
    id: "char-meridian",
    name: "Meridian",
    role: "The Hologram",
    description:
      "A memory-construct with no true body — prismatic light and data given a woman's shape. Her edges dissolve into spectrum particles whenever she lies. Appears as colossal projection in act one.",
    tags: ["Antagonist", "Full-spectrum glow", "No physical form", "consistency-v3"],
    portrait: charMeridian,
    tint: "magenta",
  },
];

export const DEMO_CANVAS_NODES: CanvasNode[] = [
  { id: "n-script", kind: "script", title: "Logline", subtitle: "Neon Requiem — v3 draft", x: 40, y: 360 },
  { id: "n-shot-1", kind: "shot", title: "SC 01 / 1 — The Ghost Above the City", subtitle: "Slow crane down · 8s", x: 400, y: 40, frame: "hero" },
  { id: "n-shot-2", kind: "shot", title: "SC 02 / 3 — Vendor Row", subtitle: "Steadicam follow · 6s", x: 400, y: 360, frame: "wide" },
  { id: "n-shot-3", kind: "shot", title: "SC 04 / 8 — Requiem", subtitle: "Slow pull out · 9s", x: 400, y: 680, frame: "hero" },
  { id: "n-char-1", kind: "character", title: "Kira Voss", subtitle: "Memory Detective", x: 800, y: 40 },
  { id: "n-char-2", kind: "character", title: "Meridian", subtitle: "The Hologram", x: 800, y: 680 },
  { id: "n-img-1", kind: "image", title: "Output — Rooftop Master", subtitle: "Prismatic Noir · 1536×864", x: 1150, y: 40, frame: "hero" },
  { id: "n-img-2", kind: "image", title: "Output — Requiem Final", subtitle: "Prismatic Noir · 1536×864", x: 1150, y: 680, frame: "hero" },
];

export const DEMO_CANVAS_LINKS: CanvasLink[] = [
  { id: "l-1", from: "n-script", to: "n-shot-1" },
  { id: "l-2", from: "n-script", to: "n-shot-2" },
  { id: "l-3", from: "n-script", to: "n-shot-3" },
  { id: "l-4", from: "n-shot-1", to: "n-char-1" },
  { id: "l-5", from: "n-shot-3", to: "n-char-2" },
  { id: "l-6", from: "n-char-1", to: "n-img-1" },
  { id: "l-7", from: "n-char-2", to: "n-img-2" },
];

export const STYLE_PRESETS = [
  "Prismatic Noir",
  "Neon Bloom",
  "Spectrum Decay",
  "Holo Minimal",
  "Analog Chrome",
  "Deep Field",
] as const;

export const CAMERA_MOVES = [
  "Static lock-off",
  "Slow push in",
  "Slow pull out",
  "Steadicam follow",
  "Handheld",
  "Crane up",
  "Crane down",
  "Whip pan",
  "Orbit / arc",
  "Dolly zoom",
  "FPV drone",
  "Lateral track",
] as const;
