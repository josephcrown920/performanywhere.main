// Builds the instruction sent with the reference photos when a scene still is composed.
export type SceneMode = "scene" | "colors" | "interior";
export type RefRole = "identity" | "outfit" | "location" | "pose" | "prop" | "interior";

const ROLE_TEXT: Record<RefRole, string> = {
  identity: "the performer — keep this exact person's face, hair, skin tone and build",
  outfit: "the outfit — dress the performer in exactly this clothing",
  location: "the location — place the performer in this exact place",
  pose: "the pose — match this body pose and camera framing",
  prop: "the car or prop — include it naturally at a realistic scale",
  interior: "the luxury car interior — seat the performer inside this exact interior",
};

export const STUDIO_COLORS = [
  ["Hot Pink", "#ff3fa4"], ["Royal Blue", "#2f4bff"], ["Neon Green", "#39ff6a"], ["Sunset Orange", "#ff7a2f"],
  ["Electric Purple", "#a640ff"], ["Cyber Yellow", "#ffe22f"], ["Crimson Red", "#d4143c"], ["Ice White", "#eef4ff"],
  ["Obsidian Black", "#111014"], ["Aqua Teal", "#1fd6c8"], ["Rose Gold", "#e8a48f"], ["Lime Pop", "#b8f02a"],
] as const;

export function buildScenePrompt(opts: { mode: SceneMode; roles: RefRole[]; direction?: string; color?: string; aspectRatio?: string }): string {
  const refs = opts.roles.map((r, i) => `Image ${i + 1} is ${ROLE_TEXT[r]}.`).join(" ");
  const frame = opts.aspectRatio === "16:9" ? "Horizontal 16:9 framing" : opts.aspectRatio === "1:1" ? "Square 1:1 framing" : "Vertical 9:16 framing";
  const base =
    opts.mode === "colors"
      ? `A music-video studio set: seamless ${opts.color || "Electric Purple"} backdrop and floor, matching ${opts.color || "purple"} color-washed key light, a vintage microphone on a stand, the performer standing centre frame.`
      : opts.mode === "interior"
        ? "The performer seated inside a luxury car interior, hands relaxed, looking toward camera, soft cinematic night light through the windows, leather and stitching detail sharp."
        : "One coherent cinematic music-video scene combining every reference.";
  return [
    "Create one photorealistic cinematic still for a music video.",
    base,
    refs,
    opts.direction ? `Direction: ${opts.direction}.` : "",
    `${frame}, the performer fully visible, lighting and shadows matching the environment, realistic scale.`,
    "One single photo — no collage, no split screen, no text, no watermark.",
  ].filter(Boolean).join(" ");
}
