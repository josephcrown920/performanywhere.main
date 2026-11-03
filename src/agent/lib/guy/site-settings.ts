import burningHouse from "@/agent/assets/guy/burning-house-background.jpg";
/** Admin-editable site settings, saved in this browser. */
export type SiteSettings = {
  brand: string;
  headline: string;
  accentWord: string;
  tagline: string;
  heroImage: string;
  tileEditor: string;
  tileCanvas: string;
  tileLayers: string;
  tilePerform: string;
  tileWorkflows: string;
  ideas: string[];
  visualDirection: string;
};

export const SITE_KEY = "reel-site-settings";
export const DEFAULT_SITE: SiteSettings = {
  brand: "GUI Video Studio",
  headline: "What are we making",
  accentWord: "today?",
  tagline: "Describe it once. The studio writes the storyboard, makes every shot and lines them up on your timeline.",
  heroImage: burningHouse,
  tileEditor: "",
  tileCanvas: "",
  tileLayers: "",
  tilePerform: "",
  tileWorkflows: "",
  ideas: [
    "A 30-second music video teaser, neon rain, slow push-ins",
    "Product launch ad for a luxury perfume, gold hour",
    "Short film opening: a lone rider crossing a desert at dawn",
  ],
  visualDirection: "Premium campaign look, ARRI Alexa 35, Cooke anamorphic, practical LED lighting, shallow depth of field, controlled reflections.",
};

export function readSite(): SiteSettings {
  if (typeof localStorage === "undefined") return DEFAULT_SITE;
  try {
    return { ...DEFAULT_SITE, ...(JSON.parse(localStorage.getItem(SITE_KEY) ?? "{}") as Partial<SiteSettings>) };
  } catch {
    return DEFAULT_SITE;
  }
}

export function saveSite(s: SiteSettings) {
  localStorage.setItem(SITE_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("site-settings"));
}
