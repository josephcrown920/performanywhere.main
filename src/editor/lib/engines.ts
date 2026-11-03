/** Generation engines exposed in the model picker. */
export type Engine = {
  id: string;
  name: string;
  /** "ark" = served by ModelArk with the user's key. */
  provider?: "ark";
  /** Gateway model id. Undefined when the engine is not served on this workspace. */
  model?: string;
  note: string;
  available: boolean;
};

/** Image engines. Seedream is the requested default but is not served by the gateway. */
export const IMAGE_ENGINES: Engine[] = [
  { id: "seedream5pro", name: "Seedream 5.0 Pro", model: "ep-20261019095901-gj979", provider: "ark", note: "ModelArk · top quality, up to 4K", available: true },
  { id: "seedream5", name: "Seedream 5.0", model: "seedream-5-0-260128", provider: "ark", note: "ModelArk · photoreal plates & edits", available: true },
  { id: "seedream45", name: "Seedream 4.5", model: "seedream-4-5-251128", provider: "ark", note: "ModelArk · fast plates", available: true },
  { id: "sunburst", name: "GPT Image 2.5 Sunburst", model: "openai/gpt-image-2.5-sunburst", note: "Photoreal plates & edits", available: true },
  { id: "flare", name: "GPT Image 2.5 Flare", model: "openai/gpt-image-2.5-flare", note: "Faster, lighter plates", available: true },
  { id: "gemini3pro", name: "Gemini 3 Pro Image", model: "google/gemini-3-pro-image", note: "Strong typography, edits & composition", available: true },
  { id: "gemini31", name: "Gemini 3.1 Flash Image", model: "google/gemini-3.1-flash-lite-image", note: "Fast iteration", available: true },
  { id: "qwenimage", name: "Qwen Image (open)", model: "qwen/qwen-image", note: "Open weights · text rendering & edits", available: true },
  { id: "flux11", name: "FLUX 1.1 Pro (open)", model: "black-forest-labs/flux-1.1-pro", note: "Open-source family · sharp photoreal", available: true },
  { id: "fluxdev", name: "FLUX.1 Dev (open)", model: "black-forest-labs/flux-dev", note: "Open weights · fast drafts", available: true },
  { id: "sdxl", name: "SDXL 1.0 (open)", model: "stability-ai/sdxl", note: "Open weights · cheap plates", available: true },
  { id: "recraft", name: "Recraft V3 (open)", model: "recraft-ai/recraft-v3", note: "Design, vector & typography", available: true },
];

/** Video engines. Seedance is the requested default but is not served by the gateway. */
export const VIDEO_ENGINES: Engine[] = [
  { id: "seedance25", name: "Seedance 2.5", model: "dreamina-seedance-2-5-260628", provider: "ark", note: "ModelArk · best motion, image-to-video", available: true },
  { id: "seedance2", name: "Seedance 2.0", model: "dreamina-seedance-2-0-260128", provider: "ark", note: "ModelArk · multimodal video", available: true },
  { id: "seedance2fast", name: "Seedance 2.0 Fast", model: "dreamina-seedance-2-0-fast-260128", provider: "ark", note: "ModelArk · quick drafts", available: true },
  { id: "omnihuman", name: "OmniHuman 1.5", model: "omnihuman-1-5", provider: "ark", note: "ModelArk · photo + voice to talking avatar (needs ModelArk key)", available: true },
  { id: "seedance1pro", name: "Seedance 1.0 Pro", model: "seedance-1-0-pro-250528", provider: "ark", note: "ModelArk · text & image to video", available: true },
  { id: "veo31", name: "Veo 3.1", model: "google/veo-3.1", note: "Best motion fidelity", available: true },
  { id: "veo31fast", name: "Veo 3.1 Fast", model: "google/veo-3.1-fast", note: "Quick motion clips", available: true },
  { id: "veo31lite", name: "Veo 3.1 Lite", model: "google/veo-3.1-lite", note: "Cheapest drafts", available: true },
  { id: "omni", name: "Gemini Omni 1.1 Flash", model: "google/gemini-omni-1.1-flash", note: "Image-to-video, editing & continuation up to 4K", available: true },
  { id: "wan22", name: "Wan 2.2 (open)", model: "alibaba/wan-2.2", note: "Open weights · strong motion", available: true },
  { id: "ltx", name: "LTX-Video 2.0 (open)", model: "lightricks/ltx-video", note: "Open weights · realtime drafts", available: true },
  { id: "hunyuan", name: "HunyuanVideo (open)", model: "tencent/hunyuan-video", note: "Open weights · cinematic motion", available: true },
  { id: "kling", name: "Kling 2.5", model: "kwaivgi/kling-v2.5", note: "Motion control · needs provider account", available: true },
];

export const DEFAULT_IMAGE_ENGINE = "sunburst";
export const DEFAULT_VIDEO_ENGINE = "omni";

export function engineModel(list: Engine[], id: string) {
  return list.find((e) => e.id === id && e.available)?.model;
}

/* ---------- motion control ---------- */
export const CAMERA_MOVES = [
  { id: "static", label: "Locked off", phrase: "locked-off static camera, no movement" },
  { id: "push", label: "Push in", phrase: "slow dolly push in towards the subject" },
  { id: "pull", label: "Pull out", phrase: "slow dolly pull out revealing the wider scene" },
  { id: "panL", label: "Pan left", phrase: "smooth camera pan to the left" },
  { id: "panR", label: "Pan right", phrase: "smooth camera pan to the right" },
  { id: "tiltU", label: "Tilt up", phrase: "camera tilts upward" },
  { id: "tiltD", label: "Tilt down", phrase: "camera tilts downward" },
  { id: "orbit", label: "Orbit", phrase: "camera orbits around the subject" },
  { id: "crane", label: "Crane up", phrase: "crane shot rising above the scene" },
  { id: "handheld", label: "Handheld", phrase: "handheld camera with natural shake" },
] as const;

export const MOTION_CURVES = [
  { id: "linear", label: "Linear", phrase: "constant speed" },
  { id: "ease", label: "Ease in-out", phrase: "easing in and out of the move" },
  { id: "ramp", label: "Speed ramp", phrase: "starting slow then ramping into a fast move" },
] as const;

export type Motion = { move: string; intensity: number; curve: string; fps: number };

export const DEFAULT_MOTION: Motion = { move: "push", intensity: 5, curve: "ease", fps: 24 };

export function motionPhrase(m: Motion) {
  const move = CAMERA_MOVES.find((c) => c.id === m.move)?.phrase ?? "";
  const curve = MOTION_CURVES.find((c) => c.id === m.curve)?.phrase ?? "";
  const strength = m.intensity <= 3 ? "very subtle" : m.intensity <= 6 ? "moderate" : "bold and pronounced";
  return `Camera motion: ${move}, ${strength}, ${curve}. Shot at ${m.fps}fps.`;
}

/* ---------- look presets ---------- */
export const FILTERS: Record<string, string> = {
  none: "none",
  "gold hour": "saturate(1.25) sepia(.22) hue-rotate(-14deg) brightness(1.05)",
  noir: "grayscale(1) contrast(1.28)",
  "violet dusk": "saturate(1.3) hue-rotate(275deg) brightness(.97)",
  "teal & orange": "saturate(1.35) contrast(1.15) hue-rotate(-8deg)",
  bleach: "contrast(1.5) saturate(.55) brightness(1.08)",
  dreamy: "blur(.7px) brightness(1.1) saturate(1.25)",
  crimson: "saturate(1.4) hue-rotate(-25deg) contrast(1.1)",
  "night vision": "grayscale(1) sepia(1) hue-rotate(60deg) saturate(3) brightness(1.15) contrast(1.3)",
  glitch: "hue-rotate(160deg) saturate(2.2) contrast(1.6)",
  cold: "saturate(.8) hue-rotate(180deg) brightness(1.05) contrast(1.1)",
  "bullet time": "contrast(1.25) saturate(1.15) blur(.3px)",
  vhs: "saturate(1.6) contrast(1.2) hue-rotate(-10deg) blur(.4px)",
  "super 8": "sepia(.45) saturate(1.2) contrast(1.15) brightness(1.05)",
  neon: "saturate(2.2) contrast(1.25) hue-rotate(300deg) brightness(1.1)",
  infrared: "hue-rotate(180deg) invert(.85) saturate(2)",
  "blood moon": "sepia(.6) saturate(3) hue-rotate(-40deg) contrast(1.2) brightness(.9)",
  matte: "contrast(.85) saturate(.85) brightness(1.08)",
  "high key": "brightness(1.3) contrast(.9) saturate(.9)",
  "low key": "brightness(.7) contrast(1.4)",
  chrome: "grayscale(.6) contrast(1.6) brightness(1.15)",
  pastel: "saturate(.6) brightness(1.2) hue-rotate(15deg)",
  emerald: "hue-rotate(90deg) saturate(1.4) contrast(1.1)",
  thermal: "invert(1) hue-rotate(180deg) saturate(3) contrast(1.3)",
  "film burn": "sepia(.35) saturate(1.5) contrast(1.15) brightness(1.05)",
  "light leak": "saturate(1.2) brightness(1.08)",
  "lens flare": "brightness(1.06) contrast(1.05)",
  "rgb split": "saturate(1.3) contrast(1.2)",
  "film grain": "contrast(1.08) saturate(.9)",
  "rain": "saturate(.75) brightness(.9) contrast(1.1)",
  "embers": "saturate(1.3) sepia(.2) contrast(1.15)",
  "smoke": "contrast(.95) brightness(.95) saturate(.85)",
  "strobe": "contrast(1.2)",
  "scanlines": "contrast(1.15) saturate(1.1)",
  "shake": "contrast(1.1)",
  "relight rim red": "contrast(1.1) brightness(.92)",
  "relight golden key": "brightness(1.04) saturate(1.15)",
  "relight cool moon": "brightness(.9) saturate(.85)",
  "relight neon split": "contrast(1.1) saturate(1.2)",
  "relight fire glow": "saturate(1.25) brightness(1.02)",
  "relight police lights": "contrast(1.1) brightness(.92)",
  "relight top spot": "contrast(1.2)",
  "relight softbox": "brightness(1.08) contrast(.92)",
};

/** One-click effect presets that set several clip properties at once. */
export type Preset = { id: string; label: string; filter?: string; speed?: number; opacity?: number; hint: string };

export const PRESETS: Preset[] = [
  { id: "cinematic", label: "Cinematic", filter: "teal & orange", speed: 1, hint: "Film-grade contrast and colour" },
  { id: "goldlux", label: "Gold Lux", filter: "gold hour", speed: 1, hint: "Warm luxury glow" },
  { id: "slowmo", label: "Slow motion", speed: 0.5, hint: "Half speed" },
  { id: "doubletime", label: "Double time", speed: 2, hint: "2x speed" },
  { id: "rampin", label: "Speed ramp", speed: 1.6, filter: "bleach", hint: "Fast push with punchy contrast" },
  { id: "noir", label: "Noir", filter: "noir", hint: "Black and white, high contrast" },
  { id: "dream", label: "Dream", filter: "dreamy", speed: 0.75, hint: "Soft, floaty look" },
  { id: "ghost", label: "Ghost overlay", opacity: 0.45, filter: "violet dusk", hint: "Semi-transparent overlay" },
  { id: "alarm", label: "Crimson alert", filter: "crimson", speed: 1.15, hint: "Urgent red grade" },
  { id: "bullettime", label: "Bullet time", filter: "bullet time", speed: 0.2, hint: "Matrix-style ultra slow motion" },
  { id: "matchcut", label: "Match cut", filter: "teal & orange", speed: 1, hint: "Hard cut on the beat with a matched look" },
  { id: "sunburst", label: "Sunburst", filter: "gold hour", speed: 1, hint: "Warm golden flare grade" },
  { id: "freeze", label: "Freeze frame", speed: 0.05, filter: "bleach", hint: "Near-frozen hold" },
  { id: "glitch", label: "Glitch", filter: "glitch", speed: 1.25, hint: "Digital glitch colour shift" },
  { id: "nightvision", label: "Night vision", filter: "night vision", hint: "Green night-vision look" },
  { id: "cold", label: "Cold FX", filter: "cold", hint: "Icy blue grade" },
  { id: "boomerang", label: "Boomerang", speed: 1.5, hint: "Quick snappy loop speed" },
  { id: "vhs", label: "VHS tape", filter: "vhs", hint: "Bleeding retro tape colour" },
  { id: "super8", label: "Super 8", filter: "super 8", speed: 0.9, hint: "Warm home-movie film" },
  { id: "neon", label: "Neon nights", filter: "neon", hint: "Electric pink club glow" },
  { id: "infrared", label: "Infrared", filter: "infrared", hint: "Surreal false-colour IR" },
  { id: "bloodmoon", label: "Blood moon", filter: "blood moon", speed: 0.85, hint: "Deep red horror grade" },
  { id: "matte", label: "Matte film", filter: "matte", hint: "Faded, lifted blacks" },
  { id: "highkey", label: "High key", filter: "high key", hint: "Bright, airy fashion look" },
  { id: "lowkey", label: "Low key", filter: "low key", hint: "Moody shadows" },
  { id: "filmburn", label: "Film burn", filter: "film burn", hint: "Hot orange burn sweeping across the frame" },
  { id: "lightleak", label: "Light leak", filter: "light leak", hint: "Drifting warm light leak" },
  { id: "lensflare", label: "Lens flare", filter: "lens flare", hint: "Anamorphic streak flare" },
  { id: "rgbsplit", label: "RGB split", filter: "rgb split", hint: "Chromatic aberration shift" },
  { id: "grain", label: "Film grain", filter: "film grain", hint: "Animated 35mm grain" },
  { id: "rain", label: "Rain", filter: "rain", hint: "Falling rain streaks" },
  { id: "embers", label: "Embers", filter: "embers", hint: "Rising fire sparks" },
  { id: "smoke", label: "Smoke", filter: "smoke", hint: "Slow drifting haze" },
  { id: "strobe", label: "Strobe", filter: "strobe", hint: "Flashing club strobe" },
  { id: "scanlines", label: "Scanlines", filter: "scanlines", hint: "CRT monitor lines" },
  { id: "shake", label: "Camera shake", filter: "shake", hint: "Handheld impact shake" },
  { id: "rimred", label: "Relight · Red rim", filter: "relight rim red", hint: "Red rim light from behind" },
  { id: "goldenkey", label: "Relight · Golden key", filter: "relight golden key", hint: "Warm sun key from the side" },
  { id: "coolmoon", label: "Relight · Moonlight", filter: "relight cool moon", hint: "Cool blue night light" },
  { id: "neonsplit", label: "Relight · Neon split", filter: "relight neon split", hint: "Pink and cyan split lighting" },
  { id: "fireglow", label: "Relight · Fire glow", filter: "relight fire glow", hint: "Flickering firelight from below" },
  { id: "policelights", label: "Relight · Police lights", filter: "relight police lights", hint: "Alternating red and blue sirens" },
  { id: "topspot", label: "Relight · Spotlight", filter: "relight top spot", hint: "Hard overhead stage spot" },
  { id: "softbox", label: "Relight · Softbox", filter: "relight softbox", hint: "Soft, even beauty light" },
  { id: "chrome", label: "Chrome", filter: "chrome", hint: "Metallic desaturated punch" },
  { id: "pastel", label: "Pastel", filter: "pastel", hint: "Soft candy colours" },
  { id: "emerald", label: "Emerald", filter: "emerald", hint: "Rich green grade" },
  { id: "thermal", label: "Thermal", filter: "thermal", hint: "Heat-camera look" },
  { id: "hyperlapse", label: "Hyperlapse", speed: 4, filter: "teal & orange", hint: "4x time-lapse push" },
  { id: "dreamslow", label: "Dream slow", speed: 0.35, filter: "pastel", hint: "Ethereal slow drift" },
  { id: "fadeghost", label: "Fade out", opacity: 0.25, hint: "Barely-there overlay" },
  { id: "reset", label: "Reset", filter: "none", speed: 1, opacity: 1, hint: "Back to source" },
];

