export type Modality = "text" | "image" | "video" | "audio";

const FREE_PROVIDER_IDS = new Set(["groq", "gemini", "cohere", "pollinations", "veo", "lovable", "modelark"]);
export { FREE_PROVIDER_IDS };

export type VideoPriceTier = "budget" | "standard" | "premium";
export const VIDEO_TIER_CREDITS: Record<VideoPriceTier, number> = {
  budget: 100,
  standard: 200,
  premium: 600,
};

export function videoPriceTier(model: string | undefined): VideoPriceTier {
  const value = (model ?? "").toLowerCase();
  if (/genjutsu|higgsfield/.test(value)) return "premium";
  if (/kling.*motion|kling-2\.6|seedance-2\.5/.test(value)) return "standard";
  if (/omnihuman|seedance-2.*mini|wan|ltx/.test(value)) return "budget";
  return "standard";
}

export function estimateCredits(modality: Modality, options: Record<string, unknown> = {}): number {
  const provider = options.provider as string | undefined;
  if (provider && FREE_PROVIDER_IDS.has(provider)) return 0;
  switch (modality) {
    case "text": return 1;
    case "image": return 50 * Math.max(1, Number(options.n ?? 1));
    case "video": {
      const duration = Math.max(1, Number(options.duration ?? 5));
      const tier = videoPriceTier(options.model as string | undefined);
      return Math.ceil(VIDEO_TIER_CREDITS[tier] * duration / 5);
    }
    case "audio": return 75;
  }
}
