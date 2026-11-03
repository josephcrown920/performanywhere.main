export const VIDEO_RESOLUTIONS = ["480p", "720p", "1080p", "4k"] as const;
export type VideoResolution = (typeof VIDEO_RESOLUTIONS)[number];

/** Veo and Omni serve at most 1080p; 4k requests fall back to 1080p. */
export function videoSettings(draft: boolean, model: string, duration = "6s", resolution?: string) {
  const capped = resolution === "4k" ? "1080p" : resolution;
  const res = VIDEO_RESOLUTIONS.includes(capped as VideoResolution) ? (capped as string) : "720p";
  return { duration: draft ? "4s" : duration, resolution: draft ? "360p" : res };
}

export function requireDepth(motion: string, hasDepth: boolean) {
  if (motion.trim() && !hasDepth) throw new Error("Motion-control jobs require a depth guide.");
}
