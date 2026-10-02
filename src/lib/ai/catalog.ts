export type Modality = "text" | "image" | "video" | "audio";

const FREE_PROVIDER_IDS = new Set(["groq", "gemini", "cohere", "pollinations", "veo", "lovable", "modelark"]);
export { FREE_PROVIDER_IDS };

export function estimateCredits(modality: Modality, options: Record<string, unknown> = {}): number {
  const provider = options.provider as string | undefined;
  if (provider && FREE_PROVIDER_IDS.has(provider)) return 0;
  switch (modality) {
    case "text": return 1;
    case "image": return 50 * Math.max(1, Number(options.n ?? 1));
    case "video": return 200 * Math.max(1, Number(options.duration ?? 5));
    case "audio": return 75;
  }
}
