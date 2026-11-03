import type { FrameKey, Shot, Tint } from "@/flow/data/demo";

const FALLBACK_FRAMES: FrameKey[] = ["wide", "portrait", "interior", "action", "wide", "hero"];
const FALLBACK_TINTS: Tint[] = ["none", "violet", "cyan", "magenta", "none", "violet"];

type Beat = { title: string; camera: string; description: (subject: string) => string };

const BEATS: Beat[] = [
  {
    title: "Cold Open",
    camera: "Slow push in from darkness",
    description: (subject) => `${subject} appears alone in frame, small against a vast luminous environment. The world hums — something is already wrong.`,
  },
  {
    title: "The World Turns",
    camera: "Wide establishing, slow lateral drift",
    description: (subject) => `Full environment reveal around ${subject}: scale, light and threat established in a single unbroken composition.`,
  },
  {
    title: "Inciting Spark",
    camera: "Whip pan to the disturbance",
    description: (subject) => `An intrusion breaks ${subject}'s routine. The catalyst enters frame and refuses to leave — the story ignites.`,
  },
  {
    title: "Descent",
    camera: "Handheld, tightening coverage",
    description: (subject) => `${subject} pursues the lead into dangerous territory. The palette darkens; stakes become physical and close.`,
  },
  {
    title: "The Reveal",
    camera: "Static symmetrical medium, then rack focus",
    description: (subject) => `The truth ${subject} has been chasing turns out to be personal. Everything recontextualizes in one held shot.`,
  },
  {
    title: "Requiem / Resolve",
    camera: "Slow pull out to widescreen silhouette",
    description: (subject) => `${subject} makes the final choice as the light dissolves around them. The last image answers the first.`,
  },
];

function subjectFromLogline(logline: string): string {
  const trimmed = logline.trim().replace(/[.!?]+$/, "");
  const words = trimmed.split(/\s+/);
  return words.length <= 6 && trimmed.length > 0 ? trimmed : "The protagonist";
}

/**
 * Deterministic offline shot list used when the AI Director call fails,
 * so the flow always produces a usable board.
 */
export function generateFallbackShots(logline: string): Shot[] {
  const subject = subjectFromLogline(logline);
  const base = Date.now();
  return BEATS.map((beat, index) => ({
    id: `shot-gen-${base}-${index}`,
    scene: `SC ${String(Math.floor(index / 2) + 1).padStart(2, "0")}`,
    number: String(index + 1),
    title: beat.title,
    description: beat.description(subject),
    camera: beat.camera,
    duration: `${4 + ((index * 3) % 6)}s`,
    frame: FALLBACK_FRAMES[index % FALLBACK_FRAMES.length] ?? "wide",
    tint: FALLBACK_TINTS[index % FALLBACK_TINTS.length] ?? "none",
    status: "ready" as const,
  }));
}

/** Assigns preview frames, tints and ids to AI-generated shot content. */
export function decorateGeneratedShots(
  generated: Array<Omit<Shot, "id" | "frame" | "tint" | "status">>,
): Shot[] {
  const base = Date.now();
  return generated.map((shot, index) => ({
    ...shot,
    id: `shot-gen-${base}-${index}`,
    frame: FALLBACK_FRAMES[index % FALLBACK_FRAMES.length] ?? "wide",
    tint: FALLBACK_TINTS[index % FALLBACK_TINTS.length] ?? "none",
    status: "ready" as const,
  }));
}
