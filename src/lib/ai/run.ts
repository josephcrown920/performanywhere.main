// Server-side generation runner: routes each modality to the Lovable AI Gateway.
import { gatewayText, gatewayImage, gatewayVideoStart } from "./gateway";
import { estimateCredits, type Modality } from "./catalog";

export type RunResult = {
  provider: string;
  model: string;
  output_url?: string;
  output_text?: string;
  credits_used: number;
  duration_ms: number;
  attempts: string[];
};

const TEXT_MODELS = ["google/gemini-3.6-flash", "openai/gpt-5.6-luna", "google/gemini-3.1-flash-lite"];
const IMAGE_MODELS = ["google/gemini-3.1-flash-image", "openai/gpt-image-2"];
const VIDEO_MODELS = ["google/veo-3.1-lite", "google/gemini-omni-1.1-flash"];
const AUDIO_MODELS = ["google/gemini-3.1-flash-lite"];

export function isFreeModelId(modelId: string): boolean {
  return ["lovable", "modelark", "gemini", "groq", "cohere", "pollinations", "veo"].includes(modelId.split("/")[0]);
}

export async function runOrchestrated(opts: {
  modality: Modality;
  modelId: string;
  prompt: string;
  options?: Record<string, unknown>;
}): Promise<RunResult> {
  const { modality, modelId, prompt, options = {} } = opts;
  const slash = modelId.indexOf("/");
  const provider = slash === -1 ? modelId : modelId.slice(0, slash);
  const model = slash === -1 ? modelId : modelId.slice(slash + 1);
  const credits = isFreeModelId(modelId) ? 0 : estimateCredits(modality, options);
  const start = Date.now();
  const attempts: string[] = [];

  if (modality === "text") {
    const chain = provider === "lovable" || provider === "modelark" ? [model, ...TEXT_MODELS] : TEXT_MODELS;
    for (const m of chain) {
      try {
        const r = await gatewayText(m, prompt, options.systemPrompt as string | undefined);
        return { provider: "lovable", model: m, output_text: r.text, credits_used: credits, duration_ms: Date.now() - start, attempts };
      } catch (e) { attempts.push(`${m}: ${e instanceof Error ? e.message : e}`); }
    }
  } else if (modality === "image") {
    const chain = provider === "lovable" ? [model, ...IMAGE_MODELS] : IMAGE_MODELS;
    for (const m of chain) {
      try {
        const url = await gatewayImage(m, prompt, options);
        return { provider: "lovable", model: m, output_url: url, credits_used: credits, duration_ms: Date.now() - start, attempts };
      } catch (e) { attempts.push(`${m}: ${e instanceof Error ? e.message : e}`); }
    }
  } else if (modality === "video") {
    const chain = provider === "lovable" ? [model, ...VIDEO_MODELS] : VIDEO_MODELS;
    for (const m of chain) {
      try {
        const job = await gatewayVideoStart({
          prompt,
          model: m,
          imageDataUrl: options.imageDataUrl as string | undefined,
          durationSeconds: (options.duration as number | undefined) ?? 5,
          aspectRatio: options.aspectRatio as string | undefined,
        });
        return { provider: "lovable", model: m, output_url: `video-job:${job.id}`, credits_used: credits, duration_ms: Date.now() - start, attempts };
      } catch (e) { attempts.push(`${m}: ${e instanceof Error ? e.message : e}`); }
    }
  } else if (modality === "audio") {
    for (const m of AUDIO_MODELS) {
      try {
        const r = await gatewayText(m, prompt);
        return { provider: "lovable", model: m, output_text: r.text, credits_used: credits, duration_ms: Date.now() - start, attempts };
      } catch (e) { attempts.push(`${m}: ${e instanceof Error ? e.message : e}`); }
    }
  }
  throw new Error(`All providers failed. Attempts: ${attempts.join("; ") || "none"}`);
}
